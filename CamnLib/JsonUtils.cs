using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib
{
  public static class JsonUtils
  {
    //Unions a list of deserialized json class data.
    public static JObject MergeJSON<T>(List<T> json)
    {
      JObject jO = new JObject();

      foreach (T o in json)
      {
        JObject jO1 = JObject.Parse(Convert.ToString(o));

        jO.Merge(jO1, new JsonMergeSettings
        {
          // union array values together to avoid duplicates
          MergeArrayHandling = MergeArrayHandling.Union
        });
      }

      return jO;
    }

    public static JArray MergeJSONArray<T>(List<T> json)
    {
      JArray jO = new JArray();

      foreach (T o in json)
      {
        JArray jO1 = JArray.Parse(Convert.ToString(o));

        jO.Merge(jO1, new JsonMergeSettings
        {
          // union array values together to avoid duplicates
          MergeArrayHandling = MergeArrayHandling.Union
        });
      }

      return jO;
    }
  }
}
