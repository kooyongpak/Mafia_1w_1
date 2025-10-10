'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CreateCampaignSchema, type CreateCampaignRequest } from '../lib/dto';
import { useCreateCampaign } from '../hooks/useCreateCampaign';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateCampaignDialog = ({ open, onOpenChange }: CreateCampaignDialogProps) => {
  const [error, setError] = useState<string | null>(null);
  const { mutate: createCampaign, isPending } = useCreateCampaign();

  const form = useForm<CreateCampaignRequest>({
    resolver: zodResolver(CreateCampaignSchema),
    defaultValues: {
      title: '',
      description: '',
      benefits: '',
      mission: '',
      store_info: '',
      recruitment_count: 10,
      recruitment_start_date: format(new Date(), 'yyyy-MM-dd'),
      recruitment_end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    },
  });

  const handleSubmit = (data: CreateCampaignRequest) => {
    setError(null);
    createCampaign(data, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : '체험단 생성 중 오류가 발생했습니다.');
      },
    });
  };

  const handleCancel = () => {
    form.reset();
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>신규 체험단 등록</DialogTitle>
          <DialogDescription>
            새로운 체험단을 등록합니다. 모든 필수 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목 *</FormLabel>
                  <FormControl>
                    <Input placeholder="체험단 제목을 입력하세요" {...field} />
                  </FormControl>
                  <FormDescription>5~100자 이내로 입력해주세요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="체험단에 대한 상세 설명을 입력하세요"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>최대 2000자까지 입력 가능합니다.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="benefits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>혜택 *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="체험단 참여 시 제공되는 혜택을 입력하세요"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>10~500자 이내로 입력해주세요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>미션 *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="체험단이 수행해야 할 미션을 입력하세요"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>10~1000자 이내로 입력해주세요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="store_info"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>매장 정보 *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="매장 주소, 영업시간 등 정보를 입력하세요"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>5~500자 이내로 입력해주세요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recruitment_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모집 인원 *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="모집 인원을 입력하세요"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormDescription>1~1000명 사이로 입력해주세요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recruitment_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>모집 시작일 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>오늘 이후 날짜</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recruitment_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>모집 종료일 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>시작일 이후, 최대 90일</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                취소
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '등록 중...' : '등록하기'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
