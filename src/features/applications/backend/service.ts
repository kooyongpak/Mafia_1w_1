import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import { applicationErrorCodes, type ApplicationErrorCode } from './error';
import type {
  CreateApplicationRequest,
  CreateApplicationResponse,
  GetApplicationsQuery,
  GetApplicationsResponse,
} from './schema';

/**
 * 체험단 지원서 생성
 *
 * @param client - Supabase 클라이언트
 * @param userId - 지원자 ID (인플루언서)
 * @param data - 지원서 데이터 (campaign_id, message, visit_date)
 * @returns HandlerResult with created application or error
 */
export const createApplication = async (
  client: SupabaseClient,
  userId: string,
  data: CreateApplicationRequest,
): Promise<HandlerResult<CreateApplicationResponse, ApplicationErrorCode, unknown>> => {
  try {
    const { campaign_id, message, visit_date } = data;

    // 1. 체험단 존재 여부 및 상태 확인
    const { data: campaign, error: campaignError } = await client
      .from('campaigns')
      .select('id, status, recruitment_start_date, recruitment_end_date')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      return failure(
        404,
        applicationErrorCodes.campaignNotFound,
        '체험단을 찾을 수 없습니다.',
        campaignError,
      );
    }

    // 2. 체험단 상태 확인 (recruiting만 허용)
    if (campaign.status !== 'recruiting') {
      return failure(
        400,
        applicationErrorCodes.campaignNotAvailable,
        '지원할 수 없는 체험단입니다.',
      );
    }

    // 3. 모집 기간 확인
    const now = new Date();
    const startDate = new Date(campaign.recruitment_start_date);
    const endDate = new Date(campaign.recruitment_end_date);

    if (now < startDate || now > endDate) {
      return failure(
        400,
        applicationErrorCodes.recruitmentClosed,
        '모집 기간이 아닙니다.',
      );
    }

    // 4. 방문 예정일자가 모집 기간 내에 있는지 확인
    const visitDate = new Date(visit_date);
    if (visitDate < startDate || visitDate > endDate) {
      return failure(
        400,
        applicationErrorCodes.invalidVisitDate,
        '방문 예정일은 모집 기간 내여야 합니다.',
      );
    }

    // 5. 중복 지원 확인
    const { data: existingApplication, error: checkError } = await client
      .from('applications')
      .select('id')
      .eq('campaign_id', campaign_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      return failure(
        500,
        applicationErrorCodes.databaseError,
        '중복 지원 확인 중 오류가 발생했습니다.',
        checkError,
      );
    }

    if (existingApplication) {
      return failure(
        409,
        applicationErrorCodes.alreadyApplied,
        '이미 지원한 체험단입니다.',
      );
    }

    // 6. 지원서 생성
    const { data: application, error: createError } = await client
      .from('applications')
      .insert({
        campaign_id,
        user_id: userId,
        message,
        visit_date,
        status: 'pending',
      })
      .select('id, campaign_id, user_id, message, visit_date, status, created_at')
      .single();

    if (createError || !application) {
      return failure(
        500,
        applicationErrorCodes.createError,
        '지원서 생성 중 오류가 발생했습니다.',
        createError,
      );
    }

    return success(application, 201);
  } catch (error) {
    return failure(
      500,
      applicationErrorCodes.databaseError,
      '지원서 생성 중 예상치 못한 오류가 발생했습니다.',
      error,
    );
  }
};

/**
 * 사용자의 체험단 지원 목록 조회
 *
 * @param client - Supabase 클라이언트
 * @param userId - 사용자 ID (인플루언서)
 * @param query - 쿼리 파라미터 (status, page, limit)
 * @returns HandlerResult with applications list or error
 */
export const getUserApplications = async (
  client: SupabaseClient,
  userId: string,
  query: GetApplicationsQuery,
): Promise<HandlerResult<GetApplicationsResponse, ApplicationErrorCode, unknown>> => {
  try {
    const { status, page, limit } = query;

    // Build base query
    let dbQuery = client
      .from('applications')
      .select(
        `
        id,
        campaign_id,
        message,
        visit_date,
        status,
        created_at,
        campaigns:campaign_id (
          id,
          title,
          recruitment_start_date,
          recruitment_end_date,
          benefits,
          status
        )
      `,
        { count: 'exact' },
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status) {
      dbQuery = dbQuery.eq('status', status);
    }

    // Get count for pagination
    const { count, error: countError } = await dbQuery;

    if (countError) {
      return failure(
        500,
        applicationErrorCodes.databaseError,
        '지원 목록 개수 조회 중 오류가 발생했습니다.',
        countError,
      );
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    // Execute query
    const { data, error } = await dbQuery;

    if (error) {
      return failure(
        500,
        applicationErrorCodes.databaseError,
        '지원 목록 조회 중 오류가 발생했습니다.',
        error,
      );
    }

    // Transform data to match schema
    const applications = (data || []).map((app) => ({
      id: app.id,
      campaign_id: app.campaign_id,
      message: app.message,
      visit_date: app.visit_date,
      status: app.status,
      created_at: app.created_at,
      campaign: Array.isArray(app.campaigns) ? app.campaigns[0] : app.campaigns,
    }));

    return success(
      {
        data: applications,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      200,
    );
  } catch (error) {
    return failure(
      500,
      applicationErrorCodes.databaseError,
      '지원 목록 조회 중 예상치 못한 오류가 발생했습니다.',
      error,
    );
  }
};
