import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { GetCampaignsQuery, GetCampaignsResponse } from './schema';
import { campaignErrorCodes, type CampaignServiceError } from './error';
import { CAMPAIGN_SORT } from '@/constants/campaigns';

const CAMPAIGNS_TABLE = 'campaigns';
const ADVERTISER_PROFILES_TABLE = 'advertiser_profiles';
const APPLICATIONS_TABLE = 'applications';

export const getCampaigns = async (
  client: SupabaseClient,
  query: GetCampaignsQuery,
): Promise<HandlerResult<GetCampaignsResponse, CampaignServiceError, unknown>> => {
  try {
    const { status, category, page, limit, sort } = query;
    const offset = (page - 1) * limit;

    console.log('getCampaigns called with:', { status, category, page, limit, sort, offset });

    let baseQuery = client
      .from(CAMPAIGNS_TABLE)
      .select(
        `
        id,
        title,
        description,
        benefits,
        recruitment_count,
        recruitment_start_date,
        recruitment_end_date,
        status,
        created_at,
        advertiser_id,
        advertiser_profiles!inner(
          id,
          company_name,
          category,
          location
        )
      `,
        { count: 'exact' },
      )
      .eq('status', status)
      .gte('recruitment_end_date', new Date().toISOString().split('T')[0]);

    if (category) {
      baseQuery = baseQuery.eq('advertiser_profiles.category', category);
    }

    switch (sort) {
      case CAMPAIGN_SORT.LATEST:
        baseQuery = baseQuery.order('created_at', { ascending: false });
        break;
      case CAMPAIGN_SORT.DEADLINE:
        baseQuery = baseQuery.order('recruitment_end_date', { ascending: true });
        break;
      case CAMPAIGN_SORT.POPULAR:
        break;
    }

    const { data: campaigns, error: campaignsError, count } = await baseQuery.range(offset, offset + limit - 1);

    if (campaignsError) {
      console.error('Supabase campaigns query error:', {
        message: campaignsError.message,
        details: campaignsError.details,
        hint: campaignsError.hint,
        code: campaignsError.code,
      });
      
      // 테이블이 없는 경우 빈 결과 반환
      if (campaignsError.code === '42P01' || campaignsError.message?.includes('does not exist')) {
        console.warn('campaigns 테이블이 존재하지 않습니다. 빈 결과를 반환합니다.');
        return success({
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            total_pages: 0,
          },
        });
      }
      
      return failure(500, campaignErrorCodes.databaseError, campaignsError.message, campaignsError);
    }

    if (!campaigns) {
      console.error('Campaigns data is null');
      // null인 경우에도 빈 배열 반환
      return success({
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          total_pages: 0,
        },
      });
    }

    console.log(`Found ${campaigns.length} campaigns, total count: ${count}`);

    const campaignIds = campaigns.map((c: any) => c.id);
    
    let applicationCounts: any[] = [];
    if (campaignIds.length > 0) {
      const { data, error: countsError } = await client
        .from(APPLICATIONS_TABLE)
        .select('campaign_id')
        .in('campaign_id', campaignIds);

      if (countsError) {
        console.error('Failed to fetch application counts:', countsError);
      } else {
        applicationCounts = data || [];
      }
    }

    const countMap = applicationCounts.reduce((acc: Record<string, number>, app: any) => {
      acc[app.campaign_id] = (acc[app.campaign_id] || 0) + 1;
      return acc;
    }, {});

    const campaignsWithCounts = campaigns.map((campaign: any) => {
      const advertiserData = campaign.advertiser_profiles;
      return {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        benefits: campaign.benefits,
        recruitment_count: campaign.recruitment_count || 0,
        recruitment_start_date: campaign.recruitment_start_date,
        recruitment_end_date: campaign.recruitment_end_date,
        status: campaign.status,
        created_at: campaign.created_at,
        advertiser: Array.isArray(advertiserData) ? advertiserData[0] : advertiserData,
        applications_count: countMap[campaign.id] || 0,
      };
    });

    if (sort === CAMPAIGN_SORT.POPULAR) {
      campaignsWithCounts.sort((a: any, b: any) => b.applications_count - a.applications_count);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log('Returning campaigns response:', {
      dataLength: campaignsWithCounts.length,
      page,
      totalPages,
    });

    return success({
      data: campaignsWithCounts,
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Unexpected error in getCampaigns:', error);
    return failure(
      500,
      campaignErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error occurred',
      error,
    );
  }
};

export const getCampaignById = async (
  client: SupabaseClient,
  campaignId: string,
): Promise<HandlerResult<import('./schema').CampaignDetail, CampaignServiceError, unknown>> => {
  try {
    console.log('getCampaignById called with:', { campaignId });

    const { data: campaign, error: campaignError } = await client
      .from(CAMPAIGNS_TABLE)
      .select(
        `
        id,
        title,
        description,
        benefits,
        mission,
        store_info,
        recruitment_count,
        recruitment_start_date,
        recruitment_end_date,
        status,
        created_at,
        advertiser_id,
        advertiser_profiles!inner(
          id,
          company_name,
          category,
          location
        )
      `,
      )
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      console.error('Supabase campaign query error:', {
        message: campaignError.message,
        details: campaignError.details,
        hint: campaignError.hint,
        code: campaignError.code,
      });

      if (campaignError.code === 'PGRST116') {
        return failure(404, campaignErrorCodes.notFound, '존재하지 않는 체험단입니다.', campaignError);
      }

      return failure(500, campaignErrorCodes.databaseError, campaignError.message, campaignError);
    }

    if (!campaign) {
      console.error('Campaign not found');
      return failure(404, campaignErrorCodes.notFound, '존재하지 않는 체험단입니다.');
    }

    const { data: applications, error: applicationsError } = await client
      .from(APPLICATIONS_TABLE)
      .select('campaign_id')
      .eq('campaign_id', campaignId);

    let applicationsCount = 0;
    if (applicationsError) {
      console.error('Failed to fetch application count:', applicationsError);
    } else {
      applicationsCount = applications?.length || 0;
    }

    const advertiserData = campaign.advertiser_profiles;
    const result = {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      benefits: campaign.benefits,
      mission: campaign.mission,
      store_info: campaign.store_info,
      recruitment_count: campaign.recruitment_count || 0,
      recruitment_start_date: campaign.recruitment_start_date,
      recruitment_end_date: campaign.recruitment_end_date,
      status: campaign.status,
      created_at: campaign.created_at,
      advertiser: Array.isArray(advertiserData) ? advertiserData[0] : advertiserData,
      applications_count: applicationsCount,
    };

    console.log('Campaign detail fetched successfully:', {
      campaignId,
      applicationsCount,
    });

    return success(result);
  } catch (error) {
    console.error('Unexpected error in getCampaignById:', error);
    return failure(
      500,
      campaignErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error occurred',
      error,
    );
  }
};

export const createCampaign = async (
  client: SupabaseClient,
  advertiserId: string,
  data: import('./schema').CreateCampaignRequest,
): Promise<HandlerResult<import('./schema').CreateCampaignResponse, CampaignServiceError, unknown>> => {
  try {
    console.log('createCampaign called with:', { advertiserId, data });

    const { data: campaign, error } = await client
      .from(CAMPAIGNS_TABLE)
      .insert({
        advertiser_id: advertiserId,
        title: data.title,
        description: data.description || null,
        benefits: data.benefits,
        mission: data.mission,
        store_info: data.store_info,
        recruitment_count: data.recruitment_count,
        recruitment_start_date: data.recruitment_start_date,
        recruitment_end_date: data.recruitment_end_date,
        status: 'recruiting',
      })
      .select('id, title, status, created_at')
      .single();

    if (error) {
      console.error('Supabase campaign insert error:', {
        message: error.message,
        details: error.details,
        code: error.code,
      });
      return failure(500, campaignErrorCodes.createError, '체험단 생성 중 오류가 발생했습니다.', error);
    }

    if (!campaign) {
      console.error('Campaign data is null after insert');
      return failure(500, campaignErrorCodes.createError, '체험단 생성 중 오류가 발생했습니다.');
    }

    console.log('Campaign created successfully:', { campaignId: campaign.id });

    return success(campaign);
  } catch (error) {
    console.error('Unexpected error in createCampaign:', error);
    return failure(
      500,
      campaignErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error occurred',
      error,
    );
  }
};

export const getAdvertiserCampaigns = async (
  client: SupabaseClient,
  advertiserId: string,
  query: import('./schema').GetAdvertiserCampaignsQuery,
): Promise<HandlerResult<import('./schema').GetAdvertiserCampaignsResponse, CampaignServiceError, unknown>> => {
  try {
    const { status, page, limit } = query;
    const offset = (page - 1) * limit;

    console.log('getAdvertiserCampaigns called with:', { advertiserId, status, page, limit, offset });

    let dbQuery = client
      .from(CAMPAIGNS_TABLE)
      .select(
        `
        id,
        title,
        description,
        benefits,
        mission,
        store_info,
        recruitment_count,
        recruitment_start_date,
        recruitment_end_date,
        status,
        created_at
      `,
        { count: 'exact' },
      )
      .eq('advertiser_id', advertiserId)
      .order('created_at', { ascending: false });

    if (status) {
      dbQuery = dbQuery.eq('status', status);
    }

    const { data: campaigns, error: campaignsError, count } = await dbQuery.range(offset, offset + limit - 1);

    if (campaignsError) {
      console.error('Supabase campaigns query error:', {
        message: campaignsError.message,
        details: campaignsError.details,
        code: campaignsError.code,
      });
      return failure(500, campaignErrorCodes.databaseError, '체험단 목록 조회 중 오류가 발생했습니다.', campaignsError);
    }

    if (!campaigns) {
      console.error('Campaigns data is null');
      return success({
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          total_pages: 0,
        },
      });
    }

    console.log(`Found ${campaigns.length} campaigns for advertiser, total count: ${count}`);

    const campaignIds = campaigns.map((c: any) => c.id);

    let applicationCounts: any[] = [];
    if (campaignIds.length > 0) {
      const { data, error: countsError } = await client
        .from(APPLICATIONS_TABLE)
        .select('campaign_id')
        .in('campaign_id', campaignIds);

      if (countsError) {
        console.error('Failed to fetch application counts:', countsError);
      } else {
        applicationCounts = data || [];
      }
    }

    const countMap = applicationCounts.reduce((acc: Record<string, number>, app: any) => {
      acc[app.campaign_id] = (acc[app.campaign_id] || 0) + 1;
      return acc;
    }, {});

    const campaignsWithCounts = campaigns.map((campaign: any) => ({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      benefits: campaign.benefits,
      mission: campaign.mission,
      store_info: campaign.store_info,
      recruitment_count: campaign.recruitment_count || 0,
      recruitment_start_date: campaign.recruitment_start_date,
      recruitment_end_date: campaign.recruitment_end_date,
      status: campaign.status,
      created_at: campaign.created_at,
      applications_count: countMap[campaign.id] || 0,
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    console.log('Returning advertiser campaigns response:', {
      dataLength: campaignsWithCounts.length,
      page,
      totalPages,
    });

    return success({
      data: campaignsWithCounts,
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Unexpected error in getAdvertiserCampaigns:', error);
    return failure(
      500,
      campaignErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error occurred',
      error,
    );
  }
};

export const checkApplication = async (
  client: SupabaseClient,
  campaignId: string,
  userId: string,
): Promise<HandlerResult<import('./schema').CheckApplicationResponse, CampaignServiceError, unknown>> => {
  try {
    console.log('checkApplication called with:', { campaignId, userId });

    const { data: application, error: applicationError } = await client
      .from(APPLICATIONS_TABLE)
      .select('id, status, created_at')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .single();

    if (applicationError) {
      if (applicationError.code === 'PGRST116') {
        console.log('No application found');
        return success({
          applied: false,
          application: null,
        });
      }

      console.error('Supabase application query error:', {
        message: applicationError.message,
        details: applicationError.details,
        code: applicationError.code,
      });

      return failure(500, campaignErrorCodes.applicationCheckError, applicationError.message, applicationError);
    }

    if (!application) {
      return success({
        applied: false,
        application: null,
      });
    }

    console.log('Application found:', { applicationId: application.id, status: application.status });

    return success({
      applied: true,
      application: {
        id: application.id,
        status: application.status,
        created_at: application.created_at,
      },
    });
  } catch (error) {
    console.error('Unexpected error in checkApplication:', error);
    return failure(
      500,
      campaignErrorCodes.applicationCheckError,
      error instanceof Error ? error.message : 'Unknown error occurred',
      error,
    );
  }
};

