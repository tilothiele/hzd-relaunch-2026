import type { ContactGroupSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { ContactGroupComponent } from '@/components/contact-group/contact-group'
import { SectionContainer } from '@/components/sections/section-container/section-container'

interface ContactGroupSectionComponentProps {
	section: ContactGroupSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

export function ContactGroupSectionComponent({
	section,
	strapiBaseUrl,
	theme,
}: ContactGroupSectionComponentProps) {
	if (!section.ContactGroup) {
		return null
	}

	return (
		<SectionContainer
			variant='max-width'
			id={section.ContactGroupAnchor || undefined}
			backgroundColor={theme.evenBgColor}
			paddingTop='2em'
			paddingBottom='2em'
		>
			<ContactGroupComponent contactGroup={section.ContactGroup} strapiBaseUrl={strapiBaseUrl} theme={theme} />
		</SectionContainer>
	)
}

