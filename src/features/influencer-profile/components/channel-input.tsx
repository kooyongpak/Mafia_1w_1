"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CHANNEL_TYPES, CHANNEL_LABELS } from "@/constants/channels";
import type { ChannelInput } from "../lib/dto";
import { validateChannelName, validateChannelUrlInput } from "../lib/validation";
import type { ChannelType } from "@/constants/channels";

type ChannelInputProps = {
  onAdd: (channel: ChannelInput) => void;
};

export const ChannelInputComponent = ({ onAdd }: ChannelInputProps) => {
  const [channelType, setChannelType] = useState<ChannelType | null>(null);
  const [channelName, setChannelName] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [errors, setErrors] = useState<{ name?: string; url?: string; type?: string }>({});

  const handleAdd = () => {
    const newErrors: { name?: string; url?: string; type?: string } = {};

    if (!channelType) {
      newErrors.type = "채널 유형을 선택해주세요.";
    }

    const nameError = validateChannelName(channelName);
    if (nameError) newErrors.name = nameError;

    if (channelType) {
      const urlError = validateChannelUrlInput(channelType, channelUrl);
      if (urlError) newErrors.url = urlError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onAdd({ channelType: channelType!, channelName, channelUrl });
    setChannelType(null);
    setChannelName("");
    setChannelUrl("");
    setErrors({});
  };

  return (
    <div className="flex flex-col gap-4 border p-4 rounded">
      <div className="flex flex-col gap-2">
        <Label>채널 유형 <span className="text-rose-500">*</span></Label>
        <Select value={channelType || ""} onValueChange={(value) => setChannelType(value as ChannelType)}>
          <SelectTrigger>
            <SelectValue placeholder="채널 유형 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CHANNEL_TYPES.NAVER}>{CHANNEL_LABELS[CHANNEL_TYPES.NAVER]}</SelectItem>
            <SelectItem value={CHANNEL_TYPES.YOUTUBE}>{CHANNEL_LABELS[CHANNEL_TYPES.YOUTUBE]}</SelectItem>
            <SelectItem value={CHANNEL_TYPES.INSTAGRAM}>{CHANNEL_LABELS[CHANNEL_TYPES.INSTAGRAM]}</SelectItem>
            <SelectItem value={CHANNEL_TYPES.THREADS}>{CHANNEL_LABELS[CHANNEL_TYPES.THREADS]}</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-rose-500">{errors.type}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="channelName">채널명 <span className="text-rose-500">*</span></Label>
        <Input
          id="channelName"
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder="채널명을 입력해주세요"
        />
        {errors.name && <p className="text-sm text-rose-500">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="channelUrl">채널 URL <span className="text-rose-500">*</span></Label>
        <Input
          id="channelUrl"
          type="url"
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          placeholder="https://..."
        />
        {errors.url && <p className="text-sm text-rose-500">{errors.url}</p>}
      </div>

      <Button type="button" onClick={handleAdd} variant="secondary">
        채널 추가
      </Button>
    </div>
  );
};
