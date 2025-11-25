import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksCardItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_card_items';
  info: {
    displayName: 'Card Item';
  };
  attributes: {
    ActionButton: Schema.Attribute.Component<'links.action-button', false>;
    BackgroundImage: Schema.Attribute.Media<'images' | 'files'>;
    FarbThema: Schema.Attribute.Enumeration<['A', 'B', 'C', 'D']>;
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
    CardItem: Schema.Attribute.Component<'blocks.card-item', true> &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    Headline: Schema.Attribute.String;
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

export interface BlocksRichTextSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_rich_text_sections';
  info: {
    displayName: 'RichTextSection';
  };
  attributes: {
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
    CtaInfoText: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<
        'plugin::ckeditor5.CKEditor',
        {
          preset: 'defaultHtml';
        }
      >;
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
    TextColumnsHeadline: Schema.Attribute.String;
    TextColumnsOddEven: Schema.Attribute.Enumeration<['Odd', 'Even']>;
    TextColumnsSubHeadline: Schema.Attribute.String;
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
      'blocks.hero-section-slide-show': BlocksHeroSectionSlideShow;
      'blocks.image-gallery-section': BlocksImageGallerySection;
      'blocks.item-list': BlocksItemList;
      'blocks.rich-text-section': BlocksRichTextSection;
      'blocks.simple-cta-section': BlocksSimpleCtaSection;
      'blocks.slide-item': BlocksSlideItem;
      'blocks.supplemental-document-group-section': BlocksSupplementalDocumentGroupSection;
      'blocks.teaser-text-with-image': BlocksTeaserTextWithImage;
      'blocks.text-columns-section': BlocksTextColumnsSection;
      'calendar.calendar-document': CalendarCalendarDocument;
      'columns.column-item': ColumnsColumnItem;
      'columns.text-column': ColumnsTextColumn;
      'layout.footer': LayoutFooter;
      'links.action-button': LinksActionButton;
      'links.partnerl-link': LinksPartnerlLink;
      'permission.groups': PermissionGroups;
      'personal.shipping-address': PersonalShippingAddress;
      'seo.seo': SeoSeo;
    }
  }
}
