export type TemplateConfig = {
  id: 1 | 2 | 3 | 4;
  labelKey: string;
  thumbnailUrl: string;
  svgUrl: string;
};

export const QR_TEMPLATES: TemplateConfig[] = [
  {
    id: 1,
    labelKey: 'qrCode.template1',
    thumbnailUrl: '/QR-templates/thumbnails/1.png',
    svgUrl: '/QR-templates/1.svg',
  },
  {
    id: 2,
    labelKey: 'qrCode.template2',
    thumbnailUrl: '/QR-templates/thumbnails/2.png',
    svgUrl: '/QR-templates/2.svg',
  },
  {
    id: 3,
    labelKey: 'qrCode.template3',
    thumbnailUrl: '/QR-templates/thumbnails/3.png',
    svgUrl: '/QR-templates/3.svg',
  },
  {
    id: 4,
    labelKey: 'qrCode.template4',
    thumbnailUrl: '/QR-templates/thumbnails/4.png',
    svgUrl: '/QR-templates/4.svg',
  },
];
