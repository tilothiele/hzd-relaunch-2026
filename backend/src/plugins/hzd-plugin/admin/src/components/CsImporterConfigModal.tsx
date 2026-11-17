import {
  Box,
  Button,
  Flex,
  Modal,
  SingleSelect,
  SingleSelectOption,
  Typography,
} from '@strapi/design-system';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import {
  BREEDER_STUD_OWNER_FIELDS,
  BREEDER_ZUECHTER_FIELDS,
  CS_FIELD_OVERWRITE_MODES,
  DOG_IMPORT_FIELDS,
  USER_IMPORT_FIELDS,
  type CsFieldOverwriteMode,
  type CsImporterConfig,
  type CsImportField,
} from '../../../server/src/cs-importer-config';
import { getTranslation } from '../utils/getTranslation';

type ConfigSection = 'user' | 'dog' | 'breeder';

interface ModeOption {
  value: CsFieldOverwriteMode;
  label: string;
}

interface FieldGroupProps {
  title?: string;
  hint?: string;
  fields: readonly CsImportField[];
  modes: Record<string, CsFieldOverwriteMode>;
  locale: string;
  modeOptions: ModeOption[];
  allFieldsLabel: string;
  sourceLabel: string;
  onChange: (key: string, mode: CsFieldOverwriteMode) => void;
  onChangeAll: (mode: CsFieldOverwriteMode) => void;
}

function isOverwriteMode(value: string | number): value is CsFieldOverwriteMode {
  return CS_FIELD_OVERWRITE_MODES.some((mode) => mode === value);
}

function isEnglish(locale: string) {
  return locale.toLowerCase().startsWith('en');
}

function fieldLabel(entry: CsImportField, locale: string) {
  return isEnglish(locale) ? entry.labelEn : entry.label;
}

function fieldHint(entry: CsImportField, locale: string) {
  return isEnglish(locale) ? entry.hintEn : entry.hint;
}

function fieldSource(entry: CsImportField, locale: string) {
  if (!entry.source) {
    return '';
  }
  return isEnglish(locale) && entry.sourceEn ? entry.sourceEn : entry.source;
}

function FieldGroup({
  title,
  hint,
  fields,
  modes,
  locale,
  modeOptions,
  allFieldsLabel,
  sourceLabel,
  onChange,
  onChangeAll,
}: FieldGroupProps) {
  const [bulk, setBulk] = useState<CsFieldOverwriteMode | null>(null);

  const handleBulk = (value: string | number) => {
    if (!isOverwriteMode(value)) {
      return;
    }
    setBulk(value);
    onChangeAll(value);
  };

  const handleField = (key: string, value: string | number) => {
    if (!isOverwriteMode(value)) {
      return;
    }
    setBulk(null);
    onChange(key, value);
  };

  return (
    <Flex direction="column" alignItems="stretch" gap={3}>
      {title ? (
        <Box>
          <Typography fontWeight="bold">{title}</Typography>
          {hint ? (
            <Box paddingTop={1}>
              <Typography textColor="neutral600" variant="pi">
                {hint}
              </Typography>
            </Box>
          ) : null}
        </Box>
      ) : null}
      <Box width="100%">
        <SingleSelect
          aria-label={allFieldsLabel}
          placeholder={allFieldsLabel}
          value={bulk}
          onChange={handleBulk}
        >
          {modeOptions.map((option) => (
            <SingleSelectOption key={option.value} value={option.value}>
              {option.label}
            </SingleSelectOption>
          ))}
        </SingleSelect>
      </Box>
      {fields.map((entry) => {
        const label = fieldLabel(entry, locale);
        const hintText = fieldHint(entry, locale);
        const source = fieldSource(entry, locale);
        return (
          <Flex
            key={entry.key}
            gap={4}
            alignItems="center"
            justifyContent="space-between"
          >
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Typography tag="div" fontWeight="bold">{label}</Typography>
              {source ? (
                <Typography
                  tag="div"
                  textColor="neutral600"
                  variant="pi"
                  style={{ overflowWrap: 'anywhere' }}
                >
                  {`${sourceLabel}: ${source}`}
                </Typography>
              ) : null}
              <Typography tag="div" textColor="neutral600" variant="pi">
                {`${entry.key} · ${entry.step}`}
              </Typography>
              {hintText ? (
                <Typography tag="div" textColor="neutral600" variant="pi">
                  {hintText}
                </Typography>
              ) : null}
            </Box>
            <Box style={{ width: '280px', flexShrink: 0 }}>
              <SingleSelect
                aria-label={label}
                value={modes[entry.key]}
                onChange={(value: string | number) => handleField(entry.key, value)}
              >
                {modeOptions.map((option) => (
                  <SingleSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </SingleSelectOption>
                ))}
              </SingleSelect>
            </Box>
          </Flex>
        );
      })}
    </Flex>
  );
}

interface CsImporterConfigModalProps {
  open: boolean;
  section: ConfigSection;
  config: CsImporterConfig;
  saving: boolean;
  onClose: () => void;
  onSave: (config: CsImporterConfig) => void;
}

function CsImporterConfigModal({
  open,
  section,
  config,
  saving,
  onClose,
  onSave,
}: CsImporterConfigModalProps) {
  const { formatMessage, locale } = useIntl();
  const [draft, setDraft] = useState<CsImporterConfig>(config);

  useEffect(() => {
    if (open) {
      setDraft(config);
    }
  }, [open, config]);

  const modeOptions: ModeOption[] = CS_FIELD_OVERWRITE_MODES.map((mode) => ({
    value: mode,
    label: formatMessage({
      id: getTranslation(`chromosoft.import.config.mode.${mode}`),
      defaultMessage: mode,
    }),
  }));
  const sourceLabel = formatMessage({
    id: getTranslation('chromosoft.import.config.source'),
    defaultMessage: 'Quelle',
  });

  const titleId = section === 'user'
    ? 'chromosoft.import.config.userTitle'
    : section === 'dog'
      ? 'chromosoft.import.config.dogTitle'
      : 'chromosoft.import.config.breederTitle';

  const setGroup = (
    key: string,
    mode: CsFieldOverwriteMode,
    group: 'user' | 'dog',
  ) => {
    setDraft((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [key]: mode,
      },
    }));
  };

  const setAll = (
    fields: readonly CsImportField[],
    mode: CsFieldOverwriteMode,
    group: 'user' | 'dog',
  ) => {
    setDraft((current) => {
      const next = { ...current[group] };
      for (const entry of fields) {
        next[entry.key as keyof typeof next] = mode;
      }
      return {
        ...current,
        [group]: next,
      };
    });
  };

  return (
    <Modal.Root
      open={open}
      onOpenChange={(nextOpen: boolean) => {
        if (!nextOpen && !saving) {
          onClose();
        }
      }}
    >
      <Modal.Content style={{ width: 'min(760px, calc(100vw - 48px))' }}>
        <Modal.Header
          closeLabel={formatMessage({
            id: getTranslation('chromosoft.import.config.close'),
            defaultMessage: 'Schließen',
          })}
        >
          <Modal.Title>
            {formatMessage({
              id: getTranslation(titleId),
              defaultMessage: 'Felder beim Update',
            })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Flex direction="column" alignItems="stretch" gap={6}>
            <Typography textColor="neutral600">
              {formatMessage({
                id: getTranslation('chromosoft.import.config.intro'),
                defaultMessage:
                  'Legt fest, wie ein vorhandener Datensatz beim Update geändert wird.',
              })}
            </Typography>
            {section === 'user' ? (
              <FieldGroup
                fields={USER_IMPORT_FIELDS}
                modes={draft.user}
                locale={locale}
                modeOptions={modeOptions}
                allFieldsLabel={formatMessage({
                  id: getTranslation('chromosoft.import.config.allFields'),
                  defaultMessage: 'Alle Felder dieser Gruppe',
                })}
                sourceLabel={sourceLabel}
                onChange={(key, mode) => setGroup(key, mode, 'user')}
                onChangeAll={(mode) => setAll(USER_IMPORT_FIELDS, mode, 'user')}
              />
            ) : null}
            {section === 'dog' ? (
              <FieldGroup
                fields={DOG_IMPORT_FIELDS}
                modes={draft.dog}
                locale={locale}
                modeOptions={modeOptions}
                allFieldsLabel={formatMessage({
                  id: getTranslation('chromosoft.import.config.allFields'),
                  defaultMessage: 'Alle Felder dieser Gruppe',
                })}
                sourceLabel={sourceLabel}
                onChange={(key, mode) => setGroup(key, mode, 'dog')}
                onChangeAll={(mode) => setAll(DOG_IMPORT_FIELDS, mode, 'dog')}
              />
            ) : null}
            {section === 'breeder' ? (
              <>
                <FieldGroup
                  title={formatMessage({
                    id: getTranslation('chromosoft.import.config.zuechter'),
                    defaultMessage: 'Züchter (Rolle B)',
                  })}
                  hint={formatMessage({
                    id: getTranslation('chromosoft.import.config.zuechterHint'),
                    defaultMessage:
                      'Diese Felder schreibt „Verarbeite CS_Member“.',
                  })}
                  fields={BREEDER_ZUECHTER_FIELDS}
                  modes={draft.breeder.zuechter}
                  locale={locale}
                  modeOptions={modeOptions}
                  allFieldsLabel={formatMessage({
                    id: getTranslation('chromosoft.import.config.allFields'),
                    defaultMessage: 'Alle Felder dieser Gruppe',
                  })}
                  sourceLabel={sourceLabel}
                  onChange={(key, mode) => {
                    setDraft((current) => ({
                      ...current,
                      breeder: {
                        ...current.breeder,
                        zuechter: {
                          ...current.breeder.zuechter,
                          [key]: mode,
                        },
                      },
                    }));
                  }}
                  onChangeAll={(mode) => {
                    setDraft((current) => {
                      const zuechter = { ...current.breeder.zuechter };
                      for (const entry of BREEDER_ZUECHTER_FIELDS) {
                        zuechter[entry.key] = mode;
                      }
                      return {
                        ...current,
                        breeder: { ...current.breeder, zuechter },
                      };
                    });
                  }}
                />
                <FieldGroup
                  title={formatMessage({
                    id: getTranslation('chromosoft.import.config.studOwner'),
                    defaultMessage: 'Deckrüdenbesitzer (Rolle S)',
                  })}
                  hint={formatMessage({
                    id: getTranslation('chromosoft.import.config.studOwnerHint'),
                    defaultMessage:
                      'Diese Felder schreibt „Aktualisiere Deckrüden“.',
                  })}
                  fields={BREEDER_STUD_OWNER_FIELDS}
                  modes={draft.breeder.deckruedenbesitzer}
                  locale={locale}
                  modeOptions={modeOptions}
                  allFieldsLabel={formatMessage({
                    id: getTranslation('chromosoft.import.config.allFields'),
                    defaultMessage: 'Alle Felder dieser Gruppe',
                  })}
                  sourceLabel={sourceLabel}
                  onChange={(key, mode) => {
                    setDraft((current) => ({
                      ...current,
                      breeder: {
                        ...current.breeder,
                        deckruedenbesitzer: {
                          ...current.breeder.deckruedenbesitzer,
                          [key]: mode,
                        },
                      },
                    }));
                  }}
                  onChangeAll={(mode) => {
                    setDraft((current) => {
                      const deckruedenbesitzer = {
                        ...current.breeder.deckruedenbesitzer,
                      };
                      for (const entry of BREEDER_STUD_OWNER_FIELDS) {
                        deckruedenbesitzer[entry.key] = mode;
                      }
                      return {
                        ...current,
                        breeder: { ...current.breeder, deckruedenbesitzer },
                      };
                    });
                  }}
                />
              </>
            ) : null}
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="tertiary"
            disabled={saving}
            onClick={onClose}
          >
            {formatMessage({
              id: getTranslation('chromosoft.import.config.cancel'),
              defaultMessage: 'Abbrechen',
            })}
          </Button>
          <Button
            type="button"
            loading={saving}
            onClick={() => onSave(draft)}
          >
            {formatMessage({
              id: getTranslation('chromosoft.import.config.save'),
              defaultMessage: 'Speichern',
            })}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}

export type { ConfigSection };
export { CsImporterConfigModal };
