"use client";

import { Button } from "@/components/ui/button";
import { CHANNEL_LABELS } from "@/constants/channels";
import type { ChannelInput } from "../lib/dto";

type ChannelListProps = {
  channels: ChannelInput[];
  onRemove: (index: number) => void;
};

export const ChannelList = ({ channels, onRemove }: ChannelListProps) => {
  if (channels.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        등록된 채널이 없습니다. 최소 1개 이상의 채널을 추가해주세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {channels.map((channel, index) => (
        <div key={index} className="flex items-center justify-between border p-3 rounded">
          <div className="flex flex-col gap-1">
            <p className="font-medium">{CHANNEL_LABELS[channel.channelType]}</p>
            <p className="text-sm text-gray-600">{channel.channelName}</p>
            <p className="text-xs text-gray-400 truncate max-w-md">{channel.channelUrl}</p>
          </div>
          <Button type="button" variant="destructive" size="sm" onClick={() => onRemove(index)}>
            삭제
          </Button>
        </div>
      ))}
    </div>
  );
};
