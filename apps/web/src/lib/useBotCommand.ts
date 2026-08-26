'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export type BotCommand = 'start' | 'pause' | 'resume' | 'stop' | 'cancel-all';

export function useBotCommand() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<BotCommand | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (botId: string, command: BotCommand) => {
    setBusy(command);
    setError(null);
    try {
      await api.botCommand(botId, command);
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      queryClient.invalidateQueries({ queryKey: ['bot', botId] });
    } catch (err: any) {
      setError(err?.message || 'Command failed');
    } finally {
      setBusy(null);
    }
  };

  return { run, busy, error, clearError: () => setError(null) };
}

export function allowedCommands(status: string): BotCommand[] {
  const cmds: BotCommand[] = [];
  switch (status) {
    case 'DRAFT':
    case 'STOPPED':
    case 'ERROR':
    case 'RANGE_EXITED':
    case 'KILLED':
      cmds.push('start');
      break;
    case 'RUNNING':
    case 'STARTING':
      cmds.push('pause', 'stop', 'cancel-all');
      break;
    case 'PAUSED':
    case 'PAUSING':
      cmds.push('resume', 'stop', 'cancel-all');
      break;
  }
  return cmds;
}
