using System;
using System.Collections.Generic;
using System.Text;

namespace CamnLib.JsonModels
{

    public class Meta
    {
        public string name { get; set; }
        public string alias { get; set; }
        public string type { get; set; }

        public bool canFilter { get; set; }
        public bool selectMultiple { get; set; }

        public List<Domain> domain { get; set; }

        public List<int> range { get; set; }
    }

    public class Domain
    {
        public string name { get; set; }
        public string code { get; set; }
    }

    

}
