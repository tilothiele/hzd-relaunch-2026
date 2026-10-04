import { Box, Button, Checkbox, Flex, Typography } from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import styled, { keyframes } from 'styled-components';

import { getTranslation } from '../utils/getTranslation';

type ImportPhase =
  | 'idle'
  | 'members'
  | 'dogs'
  | 'breeders'
  | 'studDogs'
  | 'done'
  | 'error';

type ImportStepKey = 'members' | 'dogs' | 'breeders' | 'studDogs';

interface ImportCounts {
  processed: number;
  total: number;
  skipped?: number;
}

interface ImportSteps {
  members: boolean;
  dogs: boolean;
  breeders: boolean;
  studDogs: boolean;
}

interface ImportStatus {
  phase: ImportPhase;
  steps: ImportSteps;
  members: ImportCounts;
  dogs: ImportCounts;
  breeders: ImportCounts;
  studDogs: ImportCounts;
  logFileName: string | null;
  error: string | null;
}

const STEP_ORDER: ImportStepKey[] = [
  'members',
  'dogs',
  'breeders',
  'studDogs',
];

const DEFAULT_STEPS: ImportSteps = {
  members: true,
  dogs: true,
  breeders: true,
  studDogs: true,
};

const RUNNING_PHASES: ImportPhase[] = [
  'members',
  'dogs',
  'breeders',
  'studDogs',
];

function emptyCounts(): ImportCounts {
  return { processed: 0, total: 0, skipped: 0 };
}

const IDLE_STATUS: ImportStatus = {
  phase: 'idle',
  steps: DEFAULT_STEPS,
  members: emptyCounts(),
  dogs: emptyCounts(),
  breeders: emptyCounts(),
  studDogs: emptyCounts(),
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

function asCounts(value: unknown): ImportCounts {
  if (!value || typeof value !== 'object') {
    return emptyCounts();
  }
  const counts = value as Partial<ImportCounts>;
  return {
    processed: typeof counts.processed === 'number' ? counts.processed : 0,
    total: typeof counts.total === 'number' ? counts.total : 0,
    skipped: typeof counts.skipped === 'number' ? counts.skipped : 0,
  };
}

function asSteps(value: unknown): ImportSteps {
  const source = value && typeof value === 'object'
    ? value as Partial<ImportSteps>
    : {};
  return {
    members: source.members !== false,
    dogs: source.dogs !== false,
    breeders: source.breeders !== false,
    studDogs: source.studDogs !== false,
  };
}

function normalizeStatus(value: unknown): ImportStatus | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const status = value as Partial<ImportStatus>;
  if (typeof status.phase !== 'string') {
    return null;
  }
  return {
    phase: status.phase as ImportPhase,
    steps: asSteps(status.steps),
    members: asCounts(status.members),
    dogs: asCounts(status.dogs),
    breeders: asCounts(status.breeders),
    studDogs: asCounts(status.studDogs),
    logFileName: typeof status.logFileName === 'string' ? status.logFileName : null,
    error: typeof status.error === 'string' ? status.error : null,
  };
}

function isRunningPhase(phase: ImportPhase) {
  return RUNNING_PHASES.includes(phase);
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
  const [steps, setSteps] = useState<ImportSteps>(DEFAULT_STEPS);
  const phaseRef = useRef<ImportPhase>('idle');

  const isRunning = isRunningPhase(status.phase);
  const hasSelectedStep = STEP_ORDER.some((step) => steps[step]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await get('/hzd-plugin/chromosoft/import-strapi-daten/status');
        const nextStatus = normalizeStatus(response.data);
        if (!cancelled && nextStatus) {
          setStatus(nextStatus);
          phaseRef.current = nextStatus.phase;
          if (isRunningPhase(nextStatus.phase)) {
            setSteps(nextStatus.steps);
          }
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
        const nextStatus = normalizeStatus(response.data);
        if (nextStatus) {
          setStatus(nextStatus);
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
    const wasRunning = isRunningPhase(previous);
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
              'Chromosoft-Daten verarbeitet: {members} Mitglieder ({memberSkipped} unverändert), {dogs} Hunde ({dogSkipped} unverändert), {breeders} Züchter, {studDogs} Deckrüden.',
          },
          {
            members: status.members.processed,
            dogs: status.dogs.processed,
            memberSkipped,
            dogSkipped,
            breeders: status.breeders.processed,
            studDogs: status.studDogs.processed,
          },
        )
        : formatMessage(
          {
            id: getTranslation('chromosoft.import.success'),
            defaultMessage:
              'Chromosoft-Daten verarbeitet: {members} Mitglieder, {dogs} Hunde, {breeders} Züchter, {studDogs} Deckrüden.',
          },
          {
            members: status.members.processed,
            dogs: status.dogs.processed,
            breeders: status.breeders.processed,
            studDogs: status.studDogs.processed,
          },
        );
      toggleNotification({
        type: status.error ? 'warning' : 'success',
        message: status.error ? `${message} ${status.error}` : message,
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
      const firstStep = STEP_ORDER.find((step) => steps[step]) ?? 'members';
      setStatus({
        ...IDLE_STATUS,
        phase: firstStep,
        steps,
      });
      const response = await post('/hzd-plugin/chromosoft/import-strapi-daten', {
        onlyChanged,
        steps,
      });
      const nextStatus = normalizeStatus(response.data);
      if (nextStatus) {
        setStatus(nextStatus);
      }
    } catch (error) {
      const responseData = (error as { response?: { data?: unknown } }).response?.data;
      const nextStatus = normalizeStatus(responseData);
      if (nextStatus) {
        setStatus(nextStatus);
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

  const stepLabels: Record<ImportStepKey, string> = {
    members: formatMessage({
      id: getTranslation('chromosoft.import.members'),
      defaultMessage: 'Verarbeite CS_Member',
    }),
    dogs: formatMessage({
      id: getTranslation('chromosoft.import.dogs'),
      defaultMessage: 'Verarbeite CS_Dog',
    }),
    breeders: formatMessage({
      id: getTranslation('chromosoft.import.breeders'),
      defaultMessage: 'Aktualisiere Züchterdaten',
    }),
    studDogs: formatMessage({
      id: getTranslation('chromosoft.import.studDogs'),
      defaultMessage: 'Aktualisiere Deckrüden',
    }),
  };

  const runSteps = status.phase === 'idle' ? steps : status.steps;

  const stepFinished = (step: ImportStepKey) => {
    if (!runSteps[step] || status.phase === 'error' || status.phase === 'idle') {
      return false;
    }
    if (status.phase === 'done') {
      return true;
    }
    return STEP_ORDER.indexOf(status.phase) > STEP_ORDER.indexOf(step);
  };

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
                  'Verarbeitet CS_Member und CS_Dog und aktualisiert danach Züchter und Deckrüden.',
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
          disabled={isRunning || !hasSelectedStep}
          onClick={handleImport}
        >
          {formatMessage({
            id: getTranslation('chromosoft.import.button'),
            defaultMessage: 'Chromosoft-Daten importieren',
          })}
        </Button>

        <Flex direction="column" alignItems="stretch" gap={4} width="100%">
          {STEP_ORDER.map((step) => (
            <Flex key={step} gap={3} alignItems="flex-start" width="100%">
              <Box paddingTop={1}>
                <Checkbox
                  id={`chromosoft-step-${step}`}
                  checked={steps[step]}
                  disabled={isRunning}
                  onCheckedChange={(value: boolean | 'indeterminate') => {
                    setSteps((current) => ({
                      ...current,
                      [step]: value === true,
                    }));
                  }}
                />
              </Box>
              <Box style={{ flex: 1, opacity: runSteps[step] ? 1 : 0.45 }}>
                <ImportProgressBar
                  label={stepLabels[step]}
                  counts={status[step]}
                  active={status.phase === step}
                  finished={stepFinished(step)}
                  skippedText={formatMessage(
                    {
                      id: getTranslation('chromosoft.import.skipped'),
                      defaultMessage: '{count} übersprungen',
                    },
                    { count: status[step].skipped ?? 0 },
                  )}
                />
              </Box>
            </Flex>
          ))}
        </Flex>

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
