"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BirthDateInput } from "./birth-date-input";
import { ChannelInputComponent } from "./channel-input";
import { ChannelList } from "./channel-list";
import { useCreateInfluencerProfile } from "../hooks/useCreateInfluencerProfile";
import { validateBirthDateInput } from "../lib/validation";
import type { ChannelInput } from "../lib/dto";

type InfluencerProfileFormProps = {
  userId: string;
};

export const InfluencerProfileForm = ({ userId }: InfluencerProfileFormProps) => {
  const router = useRouter();
  const [birthDate, setBirthDate] = useState("");
  const [channels, setChannels] = useState<ChannelInput[]>([]);
  const [errors, setErrors] = useState<{ birthDate?: string; channels?: string }>({});
  const { mutate, isPending, error: mutationError } = useCreateInfluencerProfile();

  const handleAddChannel = useCallback((channel: ChannelInput) => {
    setChannels((prev) => {
      if (prev.some((c) => c.channelUrl === channel.channelUrl)) {
        setErrors((e) => ({ ...e, channels: "이미 등록된 채널입니다." }));
        return prev;
      }
      setErrors((e) => ({ ...e, channels: undefined }));
      return [...prev, channel];
    });
  }, []);

  const handleRemoveChannel = useCallback((index: number) => {
    setChannels((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: { birthDate?: string; channels?: string } = {};

    const birthDateError = validateBirthDateInput(birthDate);
    if (birthDateError) newErrors.birthDate = birthDateError;

    if (channels.length === 0) {
      newErrors.channels = "최소 1개 이상의 채널을 등록해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [birthDate, channels]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      mutate(
        {
          userId,
          birthDate,
          channels,
        },
        {
          onSuccess: () => {
            router.push("/campaigns");
          },
        },
      );
    },
    [birthDate, channels, mutate, router, userId, validate],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <BirthDateInput
        value={birthDate}
        onChange={setBirthDate}
        error={errors.birthDate}
      />

      <div className="flex flex-col gap-4">
        <h3 className="font-medium">SNS 채널 관리</h3>
        <ChannelInputComponent onAdd={handleAddChannel} />
        <ChannelList channels={channels} onRemove={handleRemoveChannel} />
        {errors.channels && <p className="text-sm text-rose-500">{errors.channels}</p>}
      </div>

      {mutationError && (
        <p className="text-sm text-rose-500">{mutationError.message}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "등록 중..." : "제출"}
      </Button>
    </form>
  );
};
