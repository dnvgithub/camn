using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

// From https://stackify.com/convert-csharp-string-int/
namespace CamnLib
{
  public static class StringExtensions
  {
    public static int ParseInt(this string value, int defaultIntValue = 0)
    {
      if (int.TryParse(value, out int parsedInt))
      {
        return parsedInt;
      }

      return defaultIntValue;
    }

    public static int? ParseNullableInt(this string value)
    {
      if (string.IsNullOrEmpty(value))
        return null;

      return value.ParseInt();
    }

    public static decimal ParseDecimal(this string value, decimal defaultDecimalValue = 0m)
    {
      if (decimal.TryParse(value, out decimal parsedDecimal))
      {
        return parsedDecimal;
      }

      return defaultDecimalValue;
    }

    public static decimal? ParseNullableDecimal(this string value)
    {
      if (string.IsNullOrEmpty(value))
        return null;

      return value.ParseDecimal();
    }

    public static decimal ToJdeCYYDDD(this string yyyymmddDate)
    {
      try
      {
        DateTimeOffset toDate = DateTimeOffset.ParseExact(yyyymmddDate, "yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);

        return (toDate.Year - 1900) * 1000m + toDate.DayOfYear;
      }
      catch (Exception e)
      {
        throw new ArgumentException($"The string must be in the yyyyMMdd format but was {yyyymmddDate}", e);
      }
    }

    public static string ToFinancialAmountString(this decimal amount)
    {
      return amount.ToString("C", CultureInfo.CreateSpecificCulture("en-CA"));
    }

    public static string ToDateAndTimeString(this DateTimeOffset date)
    {
      return date.ToString("yyyy-MM-dd HH:mm:ss");
    }
  }
}
