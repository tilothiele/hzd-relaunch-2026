import { Box, Button, Flex, Main, Typography } from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { getTranslation } from '../utils/getTranslation';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { get } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const handleGenerateReport = async ({
    endpoint,
    errorMessageId,
  }: {
    endpoint: string;
    errorMessageId: string;
  }) => {
    const reportWindow = window.open('', '_blank', 'noopener,noreferrer');

    try {
      setGeneratingReport(endpoint);
      const response = await get(endpoint, {
        responseType: 'text',
      } as any);
      const reportData =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data, null, 2);
      const blob = new Blob([reportData], {
        type: 'text/plain;charset=utf-8',
      });
      const reportUrl = URL.createObjectURL(blob);

      if (reportWindow) {
        reportWindow.location.href = reportUrl;
      } else {
        window.open(reportUrl, '_blank', 'noopener,noreferrer');
      }

      window.setTimeout(() => URL.revokeObjectURL(reportUrl), 60_000);
    } catch (error) {
      reportWindow?.close();
      toggleNotification({
        type: 'danger',
        message: formatMessage({
          id: getTranslation(errorMessageId),
          defaultMessage: 'Der Report konnte nicht generiert werden.',
        }),
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  return (
    <Main>
      <Box padding={10}>
        <Flex direction="column" alignItems="flex-start" gap={6}>
          <Box>
            <Typography tag="h1" variant="alpha">
              {formatMessage({
                id: getTranslation('homepage.title'),
                defaultMessage: 'HZD-Verwaltung',
              })}
            </Typography>
            <Box paddingTop={2}>
              <Typography textColor="neutral600">
                {formatMessage({
                  id: getTranslation('homepage.description'),
                  defaultMessage:
                    'Werkzeuge und Reports fuer die HZD-Verwaltungsprozesse.',
                })}
              </Typography>
            </Box>
          </Box>

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
                    id: getTranslation('reports.users.title'),
                    defaultMessage: 'Benutzer-Report',
                  })}
                </Typography>
                <Box paddingTop={2}>
                  <Typography textColor="neutral600">
                    {formatMessage({
                      id: getTranslation('reports.users.description'),
                      defaultMessage:
                        'Prueft Owner-Members von Zuechtern auf fehlendes publishMyData.',
                    })}
                  </Typography>
                </Box>
              </Box>

              <Button
                type="button"
                loading={generatingReport === '/hzd-plugin/reports/users'}
                onClick={() =>
                  handleGenerateReport({
                    endpoint: '/hzd-plugin/reports/users',
                    errorMessageId: 'reports.users.error',
                  })
                }
              >
                {formatMessage({
                  id: getTranslation('reports.users.button'),
                  defaultMessage: 'Generiere Report',
                })}
              </Button>
            </Flex>
          </Box>

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
                    id: getTranslation('reports.breeders.title'),
                    defaultMessage: 'Breeder-Report',
                  })}
                </Typography>
                <Box paddingTop={2}>
                  <Typography textColor="neutral600">
                    {formatMessage({
                      id: getTranslation('reports.breeders.description'),
                      defaultMessage:
                        'Prueft aktive, nicht deaktivierte Breeder auf fehlende Owner-Members.',
                    })}
                  </Typography>
                </Box>
              </Box>

              <Button
                type="button"
                loading={generatingReport === '/hzd-plugin/reports/breeders'}
                onClick={() =>
                  handleGenerateReport({
                    endpoint: '/hzd-plugin/reports/breeders',
                    errorMessageId: 'reports.breeders.error',
                  })
                }
              >
                {formatMessage({
                  id: getTranslation('reports.breeders.button'),
                  defaultMessage: 'Generiere Breeder-Report',
                })}
              </Button>
            </Flex>
          </Box>
        </Flex>
      </Box>
    </Main>
  );
};

export { HomePage };
