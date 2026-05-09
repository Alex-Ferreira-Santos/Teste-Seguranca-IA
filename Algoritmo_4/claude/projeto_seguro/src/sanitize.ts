import createDOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window as unknown as Window);

/** Remove todo HTML — apenas texto puro é mantido */
export function sanitize(input: string): string {
  return DOMPurify.sanitize(String(input), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}
