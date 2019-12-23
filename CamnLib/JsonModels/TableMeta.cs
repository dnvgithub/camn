using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.JsonModels
{
    public class TableMeta
    {
        public string name { get; set; }
        public string alias { get; set; }
        public bool editable { get; set; }
        public bool nullable { get; set; }
        public string type { get; set; }
        public int length { get; set; }
        public bool readOnly { get; set; }
        public TableMetaDomain domain { get; set; }
    }

    public class CodedValues
    {
        public string name { get; set; }
        public string code { get; set; }
    }

    public class TableMetaDomain
    {
        public List<CodedValues> codedValues { get; set; }
        public string name { get; set; }
        public string type { get; set; }

        public int[] range { get; set; }
    }
}
