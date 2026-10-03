import { Box, Button, Checkbox, Flex, Typography } from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import styled, { keyframes } from 'styled-components';

import { getTranslation } from '../utils/getTranslation';

type ImportPhase = 'idle' | 'members' | 'dogs' | 'done' | 'error';

interface ImportCounts {
  processed: number;
  total: number;
  skipped?: number;
}

interface ImportStatus {
  phase: ImportPhase;
  members: ImportCounts;
  dogs: ImportCounts;
  logFileName: string | null;
  error: string | null;
}

const IDLE_STATUS: ImportStatus = {
  phase: 'idle',
  members: { processed: 0, total: 0 },
  dogs: { processed: 0, total: 0 },
  logFileName: null,
  error: null,
};

const shimmer = keyframes`
  0% { background-position: -40% 0; }
  100% { background-position: 140% 0; }
`;

const BarTrack = styled.div`
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: 4px;
  background: #dcdce4;
`;

const slide = keyframes`
  0% { transform: translateX(-120%); }
  100% { transform: translateX(280%); }
`;

const BarFill = styled.div<{ $percent: number; $active: boolean; $indeterminate: boolean }>`
  height: 100%;
  width: ${({ $percent, $indeterminate }) => ($indeterminate ? 40 : $percent)}%;
  border-radius: 4px;
  background-color: #4945ff;
  background-image: ${({ $active, $indeterminate }) =>
    $active && !$indeterminate
      ? 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)'
      : 'none'};
  background-repeat: no-repeat;
  background-size: 40% 100%;
  transition: ${({ $indeterminate }) => ($indeterminate ? 'none' : 'width 240ms ease')};
  animation: ${({ $active, $indeterminate }) => {
    if ($indeterminate) {
      return slide;
    }
    return $active ? shimmer : 'none';
  }} 1.1s linear infinite;
`;

function isImportStatus(value: unknown): value is ImportStatus {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const status = value as Partial<ImportStatus>;
  return (
    typeof status.phase === 'string' &&
    !!status.members &&
    !!status.dogs
  );
}

function readErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    return '';
  }
  const data = (error as {
    response?: { data?: { error?: { message?: string } } };
  }).response?.data;
  return data?.error?.message ?? '';
}

function visitedCount(counts: ImportCounts) {
  return counts.processed + (counts.skipped ?? 0);
}

function percentFor(counts: ImportCounts, finished: boolean) {
  if (counts.total <= 0) {
    return finished ? 100 : 0;
  }
  return Math.min(100, Math.round((visitedCount(counts) / counts.total) * 100));
}

function progressLabel(
  counts: ImportCounts,
  percent: number,
  skippedText: string,
) {
  const base = `${counts.processed} / ${counts.total}`;
  const detail = (counts.skipped ?? 0) > 0 ? `${base}, ${skippedText}` : base;
  return `${detail} (${percent}%)`;
}

function ImportProgressBar({
  label,
  counts,
  active,
  finished,
  skippedText,
}: {
  label: string;
  counts: ImportCounts;
  active: boolean;
  finished: boolean;
  skippedText: string;
}) {
  const indeterminate = active && counts.total === 0;
  const percent = percentFor(counts, finished);

  return (
    <Box width="100%">
      <Flex justifyContent="space-between">
        <Typography fontWeight="bold">{label}</Typography>
        <Typography textColor="neutral600">
          {indeterminate
            ? '…'
            : progressLabel(counts, percent, skippedText)}
        </Typography>
      </Flex>
      <Box paddingTop={2}>
        <BarTrack>
          <BarFill
            $percent={percent}
            $active={active}
            $indeterminate={indeterminate}
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={Math.max(counts.total, 0)}
            aria-valuenow={visitedCount(counts)}
          />
        </BarTrack>
      </Box>
    </Box>
  );
}

const ChromosoftImportPanel = () => {
  const { formatMessage } = useIntl();
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [status, setStatus] = useState<ImportStatus>(IDLE_STATUS);
  const [starting, setStarting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [onlyChanged, setOnlyChanged] = useState(false);
  const phaseRef = useRef<ImportPhase>('idle');

  const isRunning = status.phase === 'members' || status.phase === 'dogs';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await get('/hzd-plugin/chromosoft/import-strapi-daten/status');
        if (!cancelled && isImportStatus(response.data)) {
          setStatus(response.data);
          phaseRef.current = response.data.phase;
        }
      } catch {
        // Status ist optional, solange noch kein Lauf existiert.
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [get]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }
    const timer = window.setInterval(async () => {
      try {
        const response = await get('/hzd-plugin/chromosoft/import-strapi-daten/status');
        if (isImportStatus(response.data)) {
          setStatus(response.data);
        }
      } catch {
        // Der nächste Poll versucht es erneut.
      }
    }, 300);
    return () => window.clearInterval(timer);
  }, [get, isRunning]);

  useEffect(() => {
    const previous = phaseRef.current;
    phaseRef.current = status.phase;
    const wasRunning = previous === 'members' || previous === 'dogs';
    if (!wasRunning) {
      return;
    }
    if (status.phase === 'done') {
      const memberSkipped = status.members.skipped ?? 0;
      const dogSkipped = status.dogs.skipped ?? 0;
      const message = memberSkipped > 0 || dogSkipped > 0
        ? formatMessage(
          {
            id: getTranslation('chromosoft.import.successSkipped'),
            defaultMessage:
              'Chromosoft-Daten verarbeitet: {members} Mitglieder ({memberSkipped} unverändert), {dogs} Hunde ({dogSkipped} unverändert).',
          },
          {
            members: status.members.processed,
            dogs: status.dogs.processed,
            memberSkipped,
            dogSkipped,
          },
        )
        : formatMessage(
          {
            id: getTranslation('chromosoft.import.success'),
            defaultMessage:
              'Chromosoft-Daten verarbeitet: {members} Mitglieder, {dogs} Hunde.',
          },
          {
            members: status.members.processed,
            dogs: status.dogs.processed,
          },
        );
      toggleNotification({
        type: 'success',
        message,
      });
    }
    if (status.phase === 'error') {
      toggleNotification({
        type: 'danger',
        message:
          status.error ||
          formatMessage({
            id: getTranslation('chromosoft.import.error'),
            defaultMessage: 'Die Chromosoft-Daten konnten nicht importiert werden.',
          }),
      });
    }
  }, [formatMessage, status, toggleNotification]);

  const handleImport = async () => {
    try {
      setStarting(true);
      setStatus({
        phase: 'members',
        members: { processed: 0, total: 0 },
        dogs: { processed: 0, total: 0 },
        logFileName: null,
        error: null,
      });
      const response = await post('/hzd-plugin/chromosoft/import-strapi-daten', {
        onlyChanged,
      });
      if (isImportStatus(response.data)) {
        setStatus(response.data);
      }
    } catch (error) {
      const responseData = (error as { response?: { data?: unknown } }).response?.data;
      if (isImportStatus(responseData)) {
        setStatus(responseData);
        return;
      }
      setStatus(IDLE_STATUS);
      toggleNotification({
        type: 'danger',
        message:
          readErrorMessage(error) ||
          formatMessage({
            id: getTranslation('chromosoft.import.error'),
            defaultMessage: 'Die Chromosoft-Daten konnten nicht importiert werden.',
          }),
      });
    } finally {
      setStarting(false);
    }
  };

  const handleDownloadLog = async () => {
    try {
      setDownloading(true);
      const response = await get('/hzd-plugin/chromosoft/import-strapi-daten/log', {
        responseType: 'blob',
      } as { responseType: 'blob' });
      const payload = response.data;
      const blob =
        payload instanceof Blob
          ? payload
          : new Blob([payload], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = status.logFileName || 'import-strapi-daten.log';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message:
          readErrorMessage(error) ||
          formatMessage({
            id: getTranslation('chromosoft.import.logError'),
            defaultMessage: 'Die Logdatei konnte nicht heruntergeladen werden.',
          }),
      });
    } finally {
      setDownloading(false);
    }
  };

  const showProgress = status.phase !== 'idle';
  const membersFinished =
    status.phase === 'dogs' || status.phase === 'done' || status.phase === 'error';
  const dogsFinished = status.phase === 'done' || status.phase === 'error';

  return (
    <Box
      background="neutral0"
      borderColor="neutral150"
      hasRadius
      padding={6}
      shadow="tableShadow"
      width="100%"
    >
      <Flex direction="column" alignItems="flex-start" gap={4}>
        <Box>
          <Typography tag="h2" variant="beta">
            {formatMessage({
              id: getTranslation('chromosoft.import.title'),
              defaultMessage: 'Chromosoft',
            })}
          </Typography>
          <Box paddingTop={2}>
            <Typography textColor="neutral600">
              {formatMessage({
                id: getTranslation('chromosoft.import.description'),
                defaultMessage:
                  'Übernimmt die CS_Member und CS_Dog der aktuellen Import-Generation.',
              })}
            </Typography>
          </Box>
        </Box>

        <Flex gap={2} alignItems="center">
          <Checkbox
            id="chromosoft-only-changed"
            checked={onlyChanged}
            disabled={isRunning}
            onCheckedChange={(value: boolean | 'indeterminate') => {
              setOnlyChanged(value === true);
            }}
          />
          <Typography
            tag="label"
            htmlFor="chromosoft-only-changed"
          >
            {formatMessage({
              id: getTranslation('chromosoft.import.onlyChanged'),
              defaultMessage: 'Nur geänderte Datensätze importieren',
            })}
          </Typography>
        </Flex>

        <Button
          type="button"
          loading={starting || isRunning}
          disabled={isRunning}
          onClick={handleImport}
        >
          {formatMessage({
            id: getTranslation('chromosoft.import.button'),
            defaultMessage: 'Chromosoft-Daten importieren',
          })}
        </Button>

        {showProgress && (
          <Flex direction="column" alignItems="stretch" gap={4} width="100%">
            <ImportProgressBar
              label={formatMessage({
                id: getTranslation('chromosoft.import.members'),
                defaultMessage: 'CS_Member',
              })}
              counts={status.members}
              active={status.phase === 'members'}
              finished={membersFinished && status.phase !== 'error'}
              skippedText={formatMessage(
                {
                  id: getTranslation('chromosoft.import.skipped'),
                  defaultMessage: '{count} übersprungen',
                },
                { count: status.members.skipped ?? 0 },
              )}
            />
            <ImportProgressBar
              label={formatMessage({
                id: getTranslation('chromosoft.import.dogs'),
                defaultMessage: 'CS_Dog',
              })}
              counts={status.dogs}
              active={status.phase === 'dogs'}
              finished={dogsFinished && status.phase !== 'error'}
              skippedText={formatMessage(
                {
                  id: getTranslation('chromosoft.import.skipped'),
                  defaultMessage: '{count} übersprungen',
                },
                { count: status.dogs.skipped ?? 0 },
              )}
            />
          </Flex>
        )}

        {status.logFileName && (
          <Button
            type="button"
            variant="secondary"
            loading={downloading}
            onClick={handleDownloadLog}
          >
            {formatMessage({
              id: getTranslation('chromosoft.import.download'),
              defaultMessage: 'Logdatei herunterladen',
            })}
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export { ChromosoftImportPanel };
