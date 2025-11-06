import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksCardSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_card_sections';
  info: {
    displayName: 'Card Section';
  };
  attributes: {
    ActionButton: Schema.Attribute.Component<'links.action-button', false>;
    Headline: Schema.Attribute.String;
    SubHeadline: Schema.Attribute.String;
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

export interface BlocksPageSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_page_sections';
  info: {
    displayName: 'Page Section';
    icon: 'picture';
  };
  attributes: {};
}

export interface BlocksSlideItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_slide_items';
  info: {
    displayName: 'Slide Item';
  };
  attributes: {
    actionButton: Schema.Attribute.Component<'links.action-button', false>;
    Headline: Schema.Attribute.String;
    Subheadline: Schema.Attribute.String;
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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blocks.card-section': BlocksCardSection;
      'blocks.hero-section-slide-show': BlocksHeroSectionSlideShow;
      'blocks.page-section': BlocksPageSection;
      'blocks.slide-item': BlocksSlideItem;
      'links.action-button': LinksActionButton;
    }
  }
}
