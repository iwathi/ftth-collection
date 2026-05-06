export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// ページビューを送信
export const pageview = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// イベントを送信
export const event = ({ action, category, label, value, ...params }: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...params,
    });
  }
};

declare global {
  interface Window {
    gtag: (
      type: 'config' | 'event' | 'js',
      idOrAction: string,
      params?: any
    ) => void;
    dataLayer: any[];
  }
}
