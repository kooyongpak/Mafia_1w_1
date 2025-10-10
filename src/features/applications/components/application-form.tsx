'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useCreateApplication } from '../hooks/useCreateApplication';
import {
  APPLICATION_MESSAGE_MAX_LENGTH,
  APPLICATION_FORM_LABELS,
  APPLICATION_FORM_PLACEHOLDERS,
  APPLICATION_ERROR_MESSAGES,
  APPLICATION_SUCCESS_MESSAGES,
} from '../constants';
import { validateVisitDate } from '@/lib/utils/date-validation';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ApplicationFormProps {
  campaignId: string;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
}

/**
 * 체험단 지원서 작성 폼
 */
export const ApplicationForm = ({
  campaignId,
  recruitmentStartDate,
  recruitmentEndDate,
}: ApplicationFormProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const createApplicationMutation = useCreateApplication();

  const [message, setMessage] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [errors, setErrors] = useState<{ message?: string; visitDate?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { message?: string; visitDate?: string } = {};

    // Validate message
    if (!message.trim()) {
      newErrors.message = APPLICATION_ERROR_MESSAGES.messageRequired;
    } else if (message.length > APPLICATION_MESSAGE_MAX_LENGTH) {
      newErrors.message = APPLICATION_ERROR_MESSAGES.messageMaxLength;
    }

    // Validate visit date
    if (!visitDate) {
      newErrors.visitDate = APPLICATION_ERROR_MESSAGES.visitDateRequired;
    } else {
      const dateValidation = validateVisitDate(
        visitDate,
        recruitmentStartDate,
        recruitmentEndDate,
      );
      if (!dateValidation.valid) {
        newErrors.visitDate = dateValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createApplicationMutation.mutateAsync({
        campaign_id: campaignId,
        message: message.trim(),
        visit_date: visitDate,
      });

      toast({
        title: '성공',
        description: APPLICATION_SUCCESS_MESSAGES.submitted,
      });

      // Redirect to applications list after 1 second
      setTimeout(() => {
        router.push('/applications');
      }, 1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : APPLICATION_ERROR_MESSAGES.submitError;

      toast({
        variant: 'destructive',
        title: '오류',
        description: errorMessage,
      });
    }
  };

  const isSubmitting = createApplicationMutation.isPending;
  const canSubmit = message.trim() && visitDate && !isSubmitting;

  // Calculate min and max dates for date input
  const today = format(new Date(), 'yyyy-MM-dd');
  const minDate = format(new Date(recruitmentStartDate), 'yyyy-MM-dd');
  const maxDate = format(new Date(recruitmentEndDate), 'yyyy-MM-dd');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Message field */}
      <div className="space-y-2">
        <Label htmlFor="message">
          {APPLICATION_FORM_LABELS.message} <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (errors.message) {
              setErrors((prev) => ({ ...prev, message: undefined }));
            }
          }}
          placeholder={APPLICATION_FORM_PLACEHOLDERS.message}
          rows={6}
          maxLength={APPLICATION_MESSAGE_MAX_LENGTH}
          className={errors.message ? 'border-red-500' : ''}
          disabled={isSubmitting}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        <div className="flex items-center justify-between text-sm">
          {errors.message ? (
            <span id="message-error" className="text-red-500" role="alert">
              {errors.message}
            </span>
          ) : (
            <span />
          )}
          <span className="text-gray-500">
            {message.length}/{APPLICATION_MESSAGE_MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* Visit date field */}
      <div className="space-y-2">
        <Label htmlFor="visitDate">
          {APPLICATION_FORM_LABELS.visitDate} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="visitDate"
          type="date"
          value={visitDate}
          onChange={(e) => {
            setVisitDate(e.target.value);
            if (errors.visitDate) {
              setErrors((prev) => ({ ...prev, visitDate: undefined }));
            }
          }}
          min={today > minDate ? today : minDate}
          max={maxDate}
          className={errors.visitDate ? 'border-red-500' : ''}
          disabled={isSubmitting}
          aria-invalid={!!errors.visitDate}
          aria-describedby={errors.visitDate ? 'visitDate-error' : undefined}
        />
        {errors.visitDate && (
          <span id="visitDate-error" className="text-sm text-red-500" role="alert">
            {errors.visitDate}
          </span>
        )}
      </div>

      {/* Global error message */}
      {createApplicationMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {createApplicationMutation.error instanceof Error
              ? createApplicationMutation.error.message
              : APPLICATION_ERROR_MESSAGES.submitError}
          </AlertDescription>
        </Alert>
      )}

      {/* Submit button */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex-1"
        >
          취소
        </Button>
        <Button type="submit" disabled={!canSubmit} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              제출 중...
            </>
          ) : (
            '지원하기'
          )}
        </Button>
      </div>
    </form>
  );
};
