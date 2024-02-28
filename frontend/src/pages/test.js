import * as React from "react";
import DateRangePicker from "@cloudscape-design/components/date-range-picker";

export default () => {
  const [value, setValue] = React.useState(undefined);
  return (
    <DateRangePicker
      onChange={({ detail }) => setValue(detail.value)}
      value={value}
      isValidRange={range => {
        if (range.type === "absolute") {
          const [
            startDateWithoutTime
          ] = range.startDate.split("T");
          const [
            endDateWithoutTime
          ] = range.endDate.split("T");
          if (
            !startDateWithoutTime ||
            !endDateWithoutTime
          ) {
            return {
              valid: false,
              errorMessage:
                "The selected date range is incomplete. Select a start and end date for the date range."
            };
          }
          if (
            new Date(range.startDate) -
              new Date(range.endDate) >
            0
          ) {
            return {
              valid: false,
              errorMessage:
                "The selected date range is invalid. The start date must be before the end date."
            };
          }
        }
        return { valid: true };
      }}
      i18nStrings={{}}
      placeholder="Filter by a date and time range"
    />
  );
}