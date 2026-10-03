import { Box, Button, Flex, SingleSelect, SingleSelectOption, Typography } from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { useState } from 'react';
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
  results: ReminderResult[];
}

function isWeekOption(value: number): value is (typeof WEEK_OPTIONS)[number] {
  return (WEEK_OPTIONS as readonly number[]).includes(value);
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
  const { post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [weeks, setWeeks] = useState<(typeof WEEK_OPTIONS)[number]>(9);
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState<ReminderReport | null>(null);

  const handleWeeksChange = (value: string | number) => {
    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
    if (isWeekOption(parsed)) {
      setWeeks(parsed);
    }
  };

  const handleSend = async () => {
    try {
      setSending(true);
      const response = await post('/hzd-plugin/litters/send-reminder', { weeks });
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

        <Button type="button" loading={sending} onClick={handleSend}>
          {formatMessage({
            id: getTranslation('litterReminder.button'),
            defaultMessage: 'Erinnerungen senden',
          })}
        </Button>

        {report && (
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
