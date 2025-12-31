import sharp from 'sharp';

export async function convertIcon(args: any) {
  const { iconData, fromFormat, toFormat, size = 64, background } = args;

  if (!iconData || typeof iconData !== 'string') {
    throw new Error('iconData parameter is required and must be a string');
  }

  if (!fromFormat || !toFormat) {
    throw new Error('fromFormat and toFormat parameters are required');
  }

  if (fromFormat === toFormat) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: 'No conversion needed - formats are identical',
          format: toFormat,
          data: iconData
        }, null, 2)
      }]
    };
  }

  try {
    if (fromFormat === 'svg' && toFormat === 'png') {
      // Convert SVG to PNG using Sharp
      const svgBuffer = Buffer.from(iconData, 'utf-8');
      
      const pngBuffer = await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: background || { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();

      const base64Png = `data:image/png;base64,${pngBuffer.toString('base64')}`;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            fromFormat: 'svg',
            toFormat: 'png',
            size: `${size}x${size}`,
            data: base64Png,
            byteSize: pngBuffer.length
          }, null, 2)
        }]
      };
    }

    if (fromFormat === 'png' && toFormat === 'svg') {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'PNG to SVG conversion requires image tracing which is not supported. Use the original SVG source instead.',
            suggestion: 'Search for the icon by name using search_icons and get the SVG version with get_icon'
          }, null, 2)
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: `Conversion from ${fromFormat} to ${toFormat} is not supported`,
          supportedConversions: ['svg -> png']
        }, null, 2)
      }]
    };

  } catch (error) {
    throw new Error(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

