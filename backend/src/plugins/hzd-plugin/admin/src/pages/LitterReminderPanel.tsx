import { Box, Button, Checkbox, Field, Flex, SingleSelect, SingleSelectOption, TextInput, Typography } from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { useEffect, useState, type ChangeEvent } from 'react';
import { useIntl } from 'react-intl';

import { getTranslation } from '../utils/getTranslation';

const WEEK_OPTIONS = [9, 10, 11, 12] as const;

interface ReminderResult {
  documentId: string;
  litter: string;
  dateOfBirth: string | null;
  email: string | null;
  sent: boolean;
  reason?: string;
}

interface ReminderReport {
  weeks: number;
  cutoffDate: string;
  dryRun?: boolean;
  log?: string[];
  results: ReminderResult[];
}

function isWeekOption(value: number): value is (typeof WEEK_OPTIONS)[number] {
  return (WEEK_OPTIONS as readonly number[]).includes(value);
}

function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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

const LitterReminderPanel = () => {
  const { formatMessage } = useIntl();
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [weeks, setWeeks] = useState<(typeof WEEK_OPTIONS)[number]>(9);
  const [fromEmail, setFromEmail] = useState('');
  const [bccEmail, setBccEmail] = useState('');
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<ReminderReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    get('/hzd-plugin/litters/reminder-settings')
      .then((response) => {
        if (cancelled) {
          return;
        }
        const body = response.data as { from?: string; bcc?: string };
        setFromEmail(body.from ?? '');
        setBccEmail(body.bcc ?? '');
      })
      .catch(() => {
        // Die Felder bleiben leer und können von Hand gefüllt werden.
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDefaults(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [get]);

  const handleWeeksChange = (value: string | number) => {
    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
    if (isWeekOption(parsed)) {
      setWeeks(parsed);
    }
  };

  const handleSend = async () => {
    const from = fromEmail.trim();
    const bcc = bccEmail.trim();
    if (!isEmailAddress(from)) {
      toggleNotification({
        type: 'danger',
        message: formatMessage({
          id: getTranslation('litterReminder.fromInvalid'),
          defaultMessage: 'From muss eine gültige E-Mail-Adresse sein.',
        }),
      });
      return;
    }
    if (bcc && !isEmailAddress(bcc)) {
      toggleNotification({
        type: 'danger',
        message: formatMessage({
          id: getTranslation('litterReminder.bccInvalid'),
          defaultMessage: 'BCC muss eine gültige E-Mail-Adresse sein.',
        }),
      });
      return;
    }

    try {
      setSending(true);
      const response = await post('/hzd-plugin/litters/send-reminder', {
        weeks,
        dryRun,
        from,
        bcc,
      });
      setReport(response.data as ReminderReport);
    } catch (error) {
      const message = readErrorMessage(error);
      toggleNotification({
        type: 'danger',
        message: message || formatMessage({
          id: getTranslation('litterReminder.error'),
          defaultMessage: 'Die Wurf-Erinnerungen konnten nicht gesendet werden.',
        }),
      });
    } finally {
      setSending(false);
    }
  };

  const sent = report?.results.filter((row) => row.sent) ?? [];
  const skipped = report?.results.filter((row) => !row.sent) ?? [];

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
              id: getTranslation('litterReminder.title'),
              defaultMessage: 'Wurf-Erinnerung',
            })}
          </Typography>
          <Box paddingTop={2}>
            <Typography textColor="neutral600">
              {formatMessage({
                id: getTranslation('litterReminder.description'),
                defaultMessage:
                  'Sendet eine Mail an den Zuechter jedes Wurfs im Status Littered, dessen Geburtsdatum laenger als die gewaehlte Wochenzahl zurueckliegt.',
              })}
            </Typography>
          </Box>
        </Box>

        <Box width="420px">
          <Field.Root name="litter-reminder-from" required>
            <Field.Label>
              {formatMessage({
                id: getTranslation('litterReminder.from'),
                defaultMessage: 'From',
              })}
            </Field.Label>
            <TextInput
              type="email"
              value={fromEmail}
              disabled={sending || loadingDefaults}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setFromEmail(event.target.value);
              }}
            />
          </Field.Root>
        </Box>

        <Box width="420px">
          <Field.Root name="litter-reminder-bcc">
            <Field.Label>
              {formatMessage({
                id: getTranslation('litterReminder.bcc'),
                defaultMessage: 'BCC',
              })}
            </Field.Label>
            <TextInput
              type="email"
              value={bccEmail}
              disabled={sending || loadingDefaults}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setBccEmail(event.target.value);
              }}
            />
          </Field.Root>
        </Box>

        <Box width="240px">
          <Typography tag="label" variant="pi" fontWeight="bold">
            {formatMessage({
              id: getTranslation('litterReminder.weeks'),
              defaultMessage: 'Mindestalter in Wochen',
            })}
          </Typography>
          <Box paddingTop={1}>
            <SingleSelect
              aria-label={formatMessage({
                id: getTranslation('litterReminder.weeks'),
                defaultMessage: 'Mindestalter in Wochen',
              })}
              value={weeks}
              onChange={handleWeeksChange}
            >
              {WEEK_OPTIONS.map((option) => (
                <SingleSelectOption key={option} value={option}>
                  {String(option)}
                </SingleSelectOption>
              ))}
            </SingleSelect>
          </Box>
        </Box>

        <Flex gap={2} alignItems="center">
          <Checkbox
            id="litter-reminder-dry-run"
            checked={dryRun}
            disabled={sending}
            onCheckedChange={(value: boolean | 'indeterminate') => {
              setDryRun(value === true);
            }}
          />
          <Typography tag="label" htmlFor="litter-reminder-dry-run">
            {formatMessage({
              id: getTranslation('litterReminder.dryRun'),
              defaultMessage: 'Dry run',
            })}
          </Typography>
        </Flex>

        <Button
          type="button"
          loading={sending}
          disabled={sending || loadingDefaults}
          onClick={handleSend}
        >
          {formatMessage({
            id: getTranslation('litterReminder.button'),
            defaultMessage: 'Erinnerungen senden',
          })}
        </Button>

        {report?.dryRun && (
          <Box background="neutral100" padding={4} hasRadius width="100%">
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              {(report.log ?? []).join('\n')}
            </pre>
          </Box>
        )}

        {report && !report.dryRun && (
          <Box paddingTop={2} width="100%">
            <Typography fontWeight="bold">
              {formatMessage(
                {
                  id: getTranslation('litterReminder.sentHeading'),
                  defaultMessage: 'Gesendet ({count}), Geburt vor {cutoff}',
                },
                { count: sent.length, cutoff: report.cutoffDate },
              )}
            </Typography>
            {sent.length === 0 ? (
              <Box paddingTop={2}>
                <Typography textColor="neutral600">
                  {formatMessage({
                    id: getTranslation('litterReminder.sentEmpty'),
                    defaultMessage: 'Keine Mail versendet.',
                  })}
                </Typography>
              </Box>
            ) : (
              sent.map((row) => (
                <Box key={row.documentId || row.litter} paddingTop={2}>
                  <Typography>
                    {row.litter}
                    {' — '}
                    {row.email}
                  </Typography>
                </Box>
              ))
            )}

            {skipped.length > 0 && (
              <Box paddingTop={4}>
                <Typography fontWeight="bold">
                  {formatMessage({
                    id: getTranslation('litterReminder.skippedHeading'),
                    defaultMessage: 'Nicht gesendet',
                  })}
                </Typography>
                {skipped.map((row) => (
                  <Box key={`${row.documentId}-skipped`} paddingTop={2}>
                    <Typography textColor="neutral600">
                      {row.litter}
                      {row.email ? ` — ${row.email}` : ''}
                      {row.reason ? ` (${row.reason})` : ''}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export { LitterReminderPanel };
