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
        recruitment_count: campaign.recruitment_count,
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

