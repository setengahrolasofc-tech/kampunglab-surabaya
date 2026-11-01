const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
export const monitoringDate = (value: string) => dateFormat.format(new Date(value)) + " WIB";
export const monitoringWaitHours = (enteredAt: string, generatedAt: string) => Math.max(0, Math.floor((Date.parse(generatedAt) - Date.parse(enteredAt)) / 3600000));
