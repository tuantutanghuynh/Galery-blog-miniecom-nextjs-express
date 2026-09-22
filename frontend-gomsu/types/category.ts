export interface CategoryAttribute {
  id: string;
  categoryId: string;
  attributeKey: string;
  attributeLabel: string;
  attributeType: string;
  isRequired: boolean;
  options?: string[] | null;
}

export interface Category {
  id: string;
  parentId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  position?: number;
  attributes?: CategoryAttribute[];
  children?: Category[];
}
