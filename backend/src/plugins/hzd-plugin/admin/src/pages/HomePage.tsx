import { Box, Button, Flex, Main, Typography } from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { getTranslation } from '../utils/getTranslation';
import { ChromosoftImportPanel } from './ChromosoftImportPanel';
import { LitterReminderPanel } from './LitterReminderPanel';
import { SearchIndexPanel } from './SearchIndexPanel';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderReportDocument(
  reportWindow: Window,
  title: string,
  body: string,
) {
  reportWindow.document.open();
  reportWindow.document.write(`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  body {
    margin: 24px;
    color: #212134;
    background: #ffffff;
    font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  }
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
</head>
<body><pre>${escapeHtml(body)}</pre></body>
</html>`);
  reportWindow.document.close();
}

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { get } = useFetchClient();
  const { toggleNotification } = useNotification();
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const handleGenerateReport = async ({
    endpoint,
    errorMessageId,
    title,
  }: {
    endpoint: string;
    errorMessageId: string;
    title: string;
  }) => {
    const reportWindow = window.open('', '_blank');

    if (!reportWindow) {
      toggleNotification({
        type: 'warning',
        message: formatMessage({
          id: getTranslation('reports.popupBlocked'),
          defaultMessage:
            'Das Report-Fenster wurde vom Browser blockiert.',
        }),
      });
      return;
    }

    renderReportDocument(
      reportWindow,
      title,
      formatMessage({
        id: getTranslation('reports.loading'),
        defaultMessage: 'Report wird generiert …',
      }),
    );

    try {
      setGeneratingReport(endpoint);
      const response = await get(endpoint, {
        responseType: 'text',
      } as any);
      const reportData =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data, null, 2);

      if (!reportWindow.closed) {
        renderReportDocument(reportWindow, title, reportData);
        reportWindow.focus();
      }
    } catch (error) {
      if (!reportWindow.closed) {
        reportWindow.close();
      }
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
        <Flex direction="column" alignItems="stretch" gap={6}>
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
            width="100%"
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
                    title: formatMessage({
                      id: getTranslation('reports.users.title'),
                      defaultMessage: 'Benutzer-Report',
                    }),
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
            width="100%"
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
                    title: formatMessage({
                      id: getTranslation('reports.breeders.title'),
                      defaultMessage: 'Breeder-Report',
                    }),
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

          <ChromosoftImportPanel />

          <LitterReminderPanel />

          <SearchIndexPanel />
        </Flex>
      </Box>
    </Main>
  );
};

export { HomePage };
