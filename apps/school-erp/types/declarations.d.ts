declare module 'qrcode' {
  export function toDataURL(text: string, options?: any): Promise<string>;
  export function toDataURL(text: string, options: any, callback: (err: Error, url: string) => void): void;
  export function toString(text: string, options?: any): Promise<string>;
}

declare module 'nodemailer' {
  const nodemailer: any;
  export default nodemailer;
}
