declare module 'react-barcode' {
  import * as React from 'react';

  export interface BarcodeProps {
    value: string;
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    background?: string;
    lineColor?: string;
    margin?: number;
    textAlign?: 'center' | 'left' | 'right';
    textPosition?: 'bottom' | 'top';
    textMargin?: number;
    fontOptions?: string;
    font?: string;
    fontSize?: number;
  }

  const Barcode: React.FC<BarcodeProps>;

  export default Barcode;
}
