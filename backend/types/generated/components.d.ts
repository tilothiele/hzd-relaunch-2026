import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksCardItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_card_items';
  info: {
    displayName: 'Card Item';
  };
  attributes: {
    ActionButton: Schema.Attribute.Component<'links.action-button', false>;
    BackgroundImage: Schema.Attribute.Media<'images' | 'files'>;
    ColorTheme: Schema.Attribute.Component<'layout.color-theme', false>;
    Headline: Schema.Attribute.String;
    Subheadline: Schema.Attribute.String;
    TeaserText: Schema.Attribute.Text;
  };
}

export interface BlocksCardSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_card_sections';
  info: {
    displayName: 'Card Section';
  };
  attributes: {
    CardColumnsOddEven: Schema.Attribute.Enumeration<['Odd', 'Even']>;
    CardHeadline: Schema.Attribute.String;
    CardItem: Schema.Attribute.Component<'blocks.card-item', true> &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    CardLayout: Schema.Attribute.Enumeration<['Full Cover', 'Bordered Box']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Full Cover'>;
    CardsAnchor: Schema.Attribute.String;
  };
}

export interface BlocksContactGroupSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_contact_group_sections';
  info: {
    displayName: 'ContactGroupSection';
  };
  attributes: {
    ContactGroup: Schema.Attribute.Relation<
      'oneToOne',
      'api::contact-group.contact-group'
    >;
    ContactGroupAnchor: Schema.Attribute.String;
  };
}

export interface BlocksContactMailerSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_contact_mailer_sections';
  info: {
    displayName: 'ContactMailerSection';
  };
  attributes: {
    ContactMailerAnchor: Schema.Attribute.String;
    ContactMailerHeadline: Schema.Attribute.String;
    ContactMailerInfotext: Schema.Attribute.Text;
    ReceipientOptions: Schema.Attribute.Component<
      'blocks.email-addresses',
      true
    >;
  };
}

export interface BlocksEmailAddresses extends Struct.ComponentSchema {
  collectionName: 'components_blocks_email_addresses';
  info: {
    displayName: 'EmailAddresses';
  };
  attributes: {
    DisplayName: Schema.Attribute.String;
    Email: Schema.Attribute.Email & Schema.Attribute.Required;
  };
}

export interface BlocksHeroSectionSlideShow extends Struct.ComponentSchema {
  collectionName: 'components_blocks_hero_section_slide_shows';
  info: {
    displayName: 'Hero Section Slide Show';
  };
  attributes: {
    Headline: Schema.Attribute.Component<'blocks.slide-item', true>;
  };
}

export interface BlocksImageGallerySection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_image_gallery_sections';
  info: {
    displayName: 'ImageGallerySection';
  };
  attributes: {
    GalleryHeadline: Schema.Attribute.String;
    GalleryImages: Schema.Attribute.Media<'images', true>;
    ImageGalleryAnchor: Schema.Attribute.String;
  };
}

export interface BlocksItemList extends Struct.ComponentSchema {
  collectionName: 'components_blocks_item_lists';
  info: {
    displayName: 'Item List';
  };
  attributes: {
    ColumnItem: Schema.Attribute.Component<'columns.column-item', true>;
  };
}

export interface BlocksNewsArticlesSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_news_articles_sections';
  info: {
    displayName: 'NewsArticlesSection';
  };
  attributes: {
    MaxArticles: Schema.Attribute.Integer;
    MaxFeaturedArticles: Schema.Attribute.Integer;
    news_article_category: Schema.Attribute.Relation<
      'oneToOne',
      'api::news-article-category.news-article-category'
    >;
    NewsArticlesAnchor: Schema.Attribute.String;
  };
}

export interface BlocksRichTextSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_rich_text_sections';
  info: {
    displayName: 'RichTextSection';
  };
  attributes: {
    RichTextAnchor: Schema.Attribute.String;
    RichTextContent: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<
        'plugin::ckeditor5.CKEditor',
        {
          preset: 'defaultHtml';
        }
      >;
    RichTextOddEven: Schema.Attribute.Enumeration<['Odd', 'Even']>;
    Subtitle: Schema.Attribute.String;
    Title: Schema.Attribute.String;
  };
}

export interface BlocksSimpleCtaSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_simple_cta_sections';
  info: {
    displayName: 'SimpleCtaSection';
  };
  attributes: {
    CtaActionButton: Schema.Attribute.Component<'links.action-button', true>;
    CtaBackgroundImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios'
    >;
    CtaHeadline: Schema.Attribute.String;
    CtaInfoText: Schema.Attribute.Blocks;
    SimpleCtaAnchor: Schema.Attribute.String;
  };
}

export interface BlocksSimpleHeroSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_simple_hero_sections';
  info: {
    displayName: 'SimpleHeroSection';
  };
  attributes: {
    FadingBorder: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
    FullWidth: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
    HeroAnchor: Schema.Attribute.String;
    HeroCta: Schema.Attribute.Component<'links.action-button', false>;
    HeroHeadline: Schema.Attribute.String & Schema.Attribute.Required;
    HeroImage: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    HeroLayout: Schema.Attribute.Enumeration<
      ['Image left', 'Image right', 'full width']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Image right'>;
    HeroTeaser: Schema.Attribute.Text;
    ShowLog: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
  };
}

export interface BlocksSlideItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_slide_items';
  info: {
    displayName: 'Slide Item';
  };
  attributes: {
    ActionButton: Schema.Attribute.Component<'links.action-button', false>;
    Headline: Schema.Attribute.String;
    HeroImage: Schema.Attribute.Media<'images' | 'files'>;
    Subheadline: Schema.Attribute.String;
  };
}

export interface BlocksSupplementalDocumentGroupSection
  extends Struct.ComponentSchema {
  collectionName: 'components_blocks_supplemental_document_group_sections';
  info: {
    displayName: 'SupplementalDocumentGroupSection';
  };
  attributes: {
    GroupAnchor: Schema.Attribute.String;
    GroupHeadline: Schema.Attribute.String;
    supplemental_document_group: Schema.Attribute.Relation<
      'oneToOne',
      'api::supplemental-document-group.supplemental-document-group'
    >;
    SupplementalsOddEven: Schema.Attribute.Enumeration<['Odd', 'Even']>;
  };
}

export interface BlocksTeaserTextWithImage extends Struct.ComponentSchema {
  collectionName: 'components_blocks_teaser_text_with_images';
  info: {
    displayName: 'TeaserTextWithImageSection';
  };
  attributes: {
    ActionButton: Schema.Attribute.Component<'links.action-button', false>;
    Image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    ImagePosition: Schema.Attribute.Enumeration<['Left', 'Right']>;
    TeaserAnchor: Schema.Attribute.String;
    TeaserHeadline: Schema.Attribute.String;
    TeaserOddEven: Schema.Attribute.Enumeration<['Odd', 'Even']>;
    TeaserText: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<
        'plugin::ckeditor5.CKEditor',
        {
          preset: 'defaultHtml';
        }
      >;
  };
}

export interface BlocksTextColumnsSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_text_columns_sections';
  info: {
    displayName: 'TextColumnsSection';
  };
  attributes: {
    TextColumn: Schema.Attribute.Component<'columns.text-column', true>;
    TextColumnsAnchor: Schema.Attribute.String;
    TextColumnsHeadline: Schema.Attribute.String;
    TextColumnsOddEven: Schema.Attribute.Enumeration<['Odd', 'Even']>;
    TextColumnsSubHeadline: Schema.Attribute.String;
  };
}

export interface BreedingGeoLocation extends Struct.ComponentSchema {
  collectionName: 'components_breeding_geo_locations';
  info: {
    displayName: 'GeoLocation';
  };
  attributes: {
    lat: Schema.Attribute.Decimal & Schema.Attribute.Required;
    lng: Schema.Attribute.Decimal & Schema.Attribute.Required;
  };
}

export interface BreedingPuppyAmount extends Struct.ComponentSchema {
  collectionName: 'components_breeding_puppy_amounts';
  info: {
    displayName: 'PuppyAmount';
  };
  attributes: {
    Available: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    Total: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

export interface CalendarCalendarDocument extends Struct.ComponentSchema {
  collectionName: 'components_calendar_calendar_documents';
  info: {
    displayName: 'CalendarDocument';
  };
  attributes: {
    Description: Schema.Attribute.String;
    MediaFile: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    VisibleFrom: Schema.Attribute.DateTime;
    VisibleTo: Schema.Attribute.DateTime;
  };
}

export interface ColumnsColumnItem extends Struct.ComponentSchema {
  collectionName: 'components_columns_column_items';
  info: {
    displayName: 'Column Item';
  };
  attributes: {
    Headline: Schema.Attribute.String;
    ItemBody: Schema.Attribute.String;
  };
}

export interface ColumnsTextColumn extends Struct.ComponentSchema {
  collectionName: 'components_columns_text_columns';
  info: {
    displayName: 'Text Column';
  };
  attributes: {
    BulletItems: Schema.Attribute.Component<'columns.column-item', true>;
    ColumnActionButton: Schema.Attribute.Component<
      'links.action-button',
      false
    >;
    ColumnHeadline: Schema.Attribute.String;
    ColumnText: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<
        'plugin::ckeditor5.CKEditor',
        {
          preset: 'defaultHtml';
        }
      >;
  };
}

export interface FormBooleanChoice extends Struct.ComponentSchema {
  collectionName: 'components_form_boolean_choices';
  info: {
    displayName: 'BooleanChoice';
  };
  attributes: {
    BCDefaultValue: Schema.Attribute.Boolean;
    BCName: Schema.Attribute.String;
    BCRequired: Schema.Attribute.Boolean;
    BCRequiredValue: Schema.Attribute.Boolean;
  };
}

export interface FormChoice extends Struct.ComponentSchema {
  collectionName: 'components_form_choices';
  info: {
    displayName: 'Choice';
  };
  attributes: {
    CName: Schema.Attribute.String;
    CRequired: Schema.Attribute.Boolean;
    MultipleChoice: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    Options: Schema.Attribute.Text;
  };
}

export interface FormDogStandardIdentifier extends Struct.ComponentSchema {
  collectionName: 'components_form_dog_standard_identifiers';
  info: {
    displayName: 'DogStandardIdentifier';
  };
  attributes: {
    ChipNo: Schema.Attribute.Enumeration<['Nein', 'Ja', 'Erforderlich']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Erforderlich'>;
    DateOfBirth: Schema.Attribute.Enumeration<['Nein', 'Ja', 'Erforderlich']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Nein'>;
    GivenName: Schema.Attribute.Enumeration<['Nein', 'Ja', 'Erforderlich']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Erforderlich'>;
    KennelName: Schema.Attribute.Enumeration<['Nein', 'Ja', 'Erforderlich']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Erforderlich'>;
    Zuchtbuchnummer: Schema.Attribute.Enumeration<
      ['Nein', 'Ja', 'Erforderlich']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Ja'>;
  };
}

export interface FormEmailAdress extends Struct.ComponentSchema {
  collectionName: 'components_form_email_adresses';
  info: {
    displayName: 'EmailAdress';
  };
  attributes: {
    EAName: Schema.Attribute.String & Schema.Attribute.Required;
    EARequired: Schema.Attribute.Boolean;
  };
}

export interface FormFldGroupSeparator extends Struct.ComponentSchema {
  collectionName: 'components_form_fld_group_separators';
  info: {
    displayName: 'FldGroupSeparator';
  };
  attributes: {
    GroupName: Schema.Attribute.String;
  };
}

export interface FormFldStaticText extends Struct.ComponentSchema {
  collectionName: 'components_form_fld_static_texts';
  info: {
    displayName: 'FldStaticText';
  };
  attributes: {
    StaticContent: Schema.Attribute.Blocks;
  };
}

export interface FormFormSubmitButton extends Struct.ComponentSchema {
  collectionName: 'components_form_form_submit_buttons';
  info: {
    displayName: 'FormSubmitButton';
  };
  attributes: {
    FSBName: Schema.Attribute.String;
  };
}

export interface FormNumberInput extends Struct.ComponentSchema {
  collectionName: 'components_form_number_inputs';
  info: {
    displayName: 'NumberInput';
  };
  attributes: {
    NIMaxValue: Schema.Attribute.Integer;
    NIMinValue: Schema.Attribute.Integer;
    NIName: Schema.Attribute.String;
    NIRequired: Schema.Attribute.Boolean;
  };
}

export interface FormShortTextInput extends Struct.ComponentSchema {
  collectionName: 'components_form_short_text_inputs';
  info: {
    displayName: 'ShortTextInput';
  };
  attributes: {
    MinLength: Schema.Attribute.Integer;
    MultiLine: Schema.Attribute.Boolean;
    STName: Schema.Attribute.String;
  };
}

export interface FormStandardIdentifiers extends Struct.ComponentSchema {
  collectionName: 'components_form_standard_identifiers';
  info: {
    displayName: 'StandardIdentifiers';
  };
  attributes: {
    City: Schema.Attribute.Enumeration<['Nein', 'Ja', 'Erforderlich']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Ja'>;
    CountryCode: Schema.Attribute.Enumeration<['Nein', 'Ja', 'Erforderlich']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Ja'>;
    EMail: Schema.Attribute.Enumeration<['Erforderlich']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Erforderlich'>;
    FirstName: Schema.Attribute.Enumeration<['Nein', 'Ja', 'Erforderlich']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Erforderlich'>;
    LastName: Schema.Attribute.Enumeration<['Nein', 'Ja', 'Erforderlich']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Erforderlich'>;
    MembershipNumber: Schema.Attribute.Enumeration<
      ['Nein', 'Ja', 'Erforderlich']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Ja'>;
    Phone: Schema.Attribute.Enumeration<['Nein', 'Ja', 'Erforderlich']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Ja'>;
    Street: Schema.Attribute.Enumeration<['Nein', 'Ja', 'Erforderlich']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Ja'>;
    Zip: Schema.Attribute.Enumeration<['Nein', 'Ja', 'Erforderlich']> &
      Schema.Attribute.DefaultTo<'Ja'>;
  };
}

export interface FormTextArea extends Struct.ComponentSchema {
  collectionName: 'components_form_text_areas';
  info: {
    displayName: 'TextArea';
  };
  attributes: {
    TAName: Schema.Attribute.String;
  };
}

export interface LayoutColorTheme extends Struct.ComponentSchema {
  collectionName: 'components_layout_color_themes';
  info: {
    displayName: 'ColorTheme';
  };
  attributes: {
    ShortName: Schema.Attribute.Enumeration<['A', 'B', 'C', 'D', 'E']>;
  };
}

export interface LayoutFooter extends Struct.ComponentSchema {
  collectionName: 'components_layout_footers';
  info: {
    displayName: 'Footer';
  };
  attributes: {
    ItProjektleitungName: Schema.Attribute.String;
    ItProjektleitungOrt: Schema.Attribute.String;
    ItProjektleitungTelefon: Schema.Attribute.String;
    PraesidiumName: Schema.Attribute.String;
    PraesidiumOrt: Schema.Attribute.String;
    PraesidiumTelefon: Schema.Attribute.String;
  };
}

export interface LayoutSos extends Struct.ComponentSchema {
  collectionName: 'components_layout_sos';
  info: {
    displayName: 'SOS';
  };
  attributes: {
    ShowSOS: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    SosLink: Schema.Attribute.String;
    SosTitle: Schema.Attribute.String;
  };
}

export interface LinksActionButton extends Struct.ComponentSchema {
  collectionName: 'components_links_action_buttons';
  info: {
    displayName: 'Action Button';
  };
  attributes: {
    Label: Schema.Attribute.String;
    Link: Schema.Attribute.String;
    Primary: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface LinksPartnerlLink extends Struct.ComponentSchema {
  collectionName: 'components_links_partnerl_links';
  info: {
    displayName: 'PartnerlLink';
  };
  attributes: {
    AltText: Schema.Attribute.String;
    Logo: Schema.Attribute.Media<'images'>;
    PartnerLinkUrl: Schema.Attribute.String;
  };
}

export interface PermissionGroups extends Struct.ComponentSchema {
  collectionName: 'components_permission_groups';
  info: {
    displayName: 'Groups';
  };
  attributes: {
    Any: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    BreedWarden: Schema.Attribute.Boolean;
    HeadOfEvent: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    Member: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface PermissionRestriction extends Struct.ComponentSchema {
  collectionName: 'components_permission_restrictions';
  info: {
    displayName: 'Restriction';
  };
  attributes: {
    Authenticated: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
    Public: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
  };
}

export interface PersonalAddress extends Struct.ComponentSchema {
  collectionName: 'components_personal_addresses';
  info: {
    displayName: 'Address';
  };
  attributes: {
    Address1: Schema.Attribute.String;
    Address2: Schema.Attribute.String;
    City: Schema.Attribute.String;
    CountryCode: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 2;
      }> &
      Schema.Attribute.DefaultTo<'D'>;
    FullName: Schema.Attribute.String;
    Zip: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 5;
      }>;
  };
}

export interface PersonalShippingAddress extends Struct.ComponentSchema {
  collectionName: 'components_personal_shipping_addresses';
  info: {
    displayName: 'Address';
  };
  attributes: {
    AdditionalName: Schema.Attribute.String;
    City: Schema.Attribute.String;
    CountryCode: Schema.Attribute.String;
    Name: Schema.Attribute.String;
    Street: Schema.Attribute.String;
    ZipCode: Schema.Attribute.String;
  };
}

export interface SeoSeo extends Struct.ComponentSchema {
  collectionName: 'components_seo_seos';
  info: {
    displayName: 'SEO';
  };
  attributes: {
    ExcludeFromSitemap: Schema.Attribute.Boolean;
    Keywords: Schema.Attribute.String;
    MetaDescription: Schema.Attribute.String;
    TitleTag: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blocks.card-item': BlocksCardItem;
      'blocks.card-section': BlocksCardSection;
      'blocks.contact-group-section': BlocksContactGroupSection;
      'blocks.contact-mailer-section': BlocksContactMailerSection;
      'blocks.email-addresses': BlocksEmailAddresses;
      'blocks.hero-section-slide-show': BlocksHeroSectionSlideShow;
      'blocks.image-gallery-section': BlocksImageGallerySection;
      'blocks.item-list': BlocksItemList;
      'blocks.news-articles-section': BlocksNewsArticlesSection;
      'blocks.rich-text-section': BlocksRichTextSection;
      'blocks.simple-cta-section': BlocksSimpleCtaSection;
      'blocks.simple-hero-section': BlocksSimpleHeroSection;
      'blocks.slide-item': BlocksSlideItem;
      'blocks.supplemental-document-group-section': BlocksSupplementalDocumentGroupSection;
      'blocks.teaser-text-with-image': BlocksTeaserTextWithImage;
      'blocks.text-columns-section': BlocksTextColumnsSection;
      'breeding.geo-location': BreedingGeoLocation;
      'breeding.puppy-amount': BreedingPuppyAmount;
      'calendar.calendar-document': CalendarCalendarDocument;
      'columns.column-item': ColumnsColumnItem;
      'columns.text-column': ColumnsTextColumn;
      'form.boolean-choice': FormBooleanChoice;
      'form.choice': FormChoice;
      'form.dog-standard-identifier': FormDogStandardIdentifier;
      'form.email-adress': FormEmailAdress;
      'form.fld-group-separator': FormFldGroupSeparator;
      'form.fld-static-text': FormFldStaticText;
      'form.form-submit-button': FormFormSubmitButton;
      'form.number-input': FormNumberInput;
      'form.short-text-input': FormShortTextInput;
      'form.standard-identifiers': FormStandardIdentifiers;
      'form.text-area': FormTextArea;
      'layout.color-theme': LayoutColorTheme;
      'layout.footer': LayoutFooter;
      'layout.sos': LayoutSos;
      'links.action-button': LinksActionButton;
      'links.partnerl-link': LinksPartnerlLink;
      'permission.groups': PermissionGroups;
      'permission.restriction': PermissionRestriction;
      'personal.address': PersonalAddress;
      'personal.shipping-address': PersonalShippingAddress;
      'seo.seo': SeoSeo;
    }
  }
}
