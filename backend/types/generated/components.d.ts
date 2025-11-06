import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksCardSection extends Struct.ComponentSchema {
  collectionName: 'components_blocks_card_sections';
  info: {
    displayName: 'Card Section';
  };
  attributes: {
    ActionButton: Schema.Attribute.Component<'links.action-button', false>;
    BackgroundImage: Schema.Attribute.Media<'images' | 'files'>;
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

export interface BlocksItemList extends Struct.ComponentSchema {
  collectionName: 'components_blocks_item_lists';
  info: {
    displayName: 'Item List';
  };
  attributes: {
    ColumnItem: Schema.Attribute.Component<'columns.column-item', true>;
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
    HeroImage: Schema.Attribute.Media<'images' | 'files'>;
    Subheadline: Schema.Attribute.String;
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
    Blocks: Schema.Attribute.Blocks;
    Content: Schema.Attribute.String;
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
      'blocks.item-list': BlocksItemList;
      'blocks.page-section': BlocksPageSection;
      'blocks.slide-item': BlocksSlideItem;
      'columns.column-item': ColumnsColumnItem;
      'columns.text-column': ColumnsTextColumn;
      'links.action-button': LinksActionButton;
    }
  }
}
