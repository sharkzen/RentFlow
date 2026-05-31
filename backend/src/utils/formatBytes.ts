export function formatBytes(
  bytes: number,
  decimals = 2,
): {
  value: string;
  unit: string;
  rawGB: number;
} {
  if (bytes === 0)
    return {
      value: "0",
      unit: "Bytes",
      rawGB: 0,
    };

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const rawGB = bytes / (k * k * k);

  return {
    value: parseFloat((bytes / Math.pow(k, i)).toFixed(dm)).toString(),
    unit: sizes[i],
    rawGB: rawGB,
  };
}
