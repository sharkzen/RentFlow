type DateFormatType =
  | "full"
  | "short"
  | "datetime"
  | "short-datetime"
  | "time"
  | "month-year";

export const formatThaiDate = (
  dateInput: string | Date | number | undefined | null,
  formatType: DateFormatType = "short",
): string => {
  if (!dateInput) return "-";

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) return "-";

  switch (formatType) {
    case "full":
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "short":
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    case "datetime": {
      const fullDate = date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const time = date.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `${fullDate} เวลา ${time} น.`;
    }
    case "short-datetime": {
      const shortDate = date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      const time = date.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `${shortDate} ${time} น.`;
    }
    case "time":
      return `${date.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      })} น.`;
    case "month-year":
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
      });
    default:
      return date.toLocaleDateString("th-TH");
  }
};
