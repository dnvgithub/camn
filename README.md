# CAMN

As part of the District of North Vancouver’s initiative to incorporate climate change awareness into our asset management processes, and following our commitment to the Climate and Asset Management Network initiative spearheaded by the Federation of Canadian Municipalities, we have developed the CAMN Application.

The CAMN App is a map-centric application to help manage storm water-related assets. It’s has been developed to meet the needs of multiple departments within the organization through integrations with GIS, asset maintenance and inspection processes, capacity modelling, and asset financials within our ERP.

### Storm Infrastructure
Currently the app focuses on assets related to the management of storm water throughout the municipality:
-   Storm Mains
-   Culverts
-   Debris Basins
-   Artificial Watercourses
-   Other associated assets

### Reducing Vulnerability to Climate Change
The CAMN Application contributes to mitigating climate change vulnerability by ensuring capital programs are effective at maintaining service levels. The application serves as a repository for assessment and design information to ensure renewed infrastructure is adequately sized for future conditions. In addition, the web app collects operating and maintenance information to greatly improve documentation processes. The app allows staff to identify chronically undersized infrastructure that no longer function adequately as the effects of climate change become more pronounced.


## Installation & Usage

-   Clone this repo
-   Update `dnv-lib` path in [`CamnClient/ClientApp/package.json`](CamnClient/ClientApp/package.json) to reference output from the [app_framework](https://github.com/dnvgithub/app_framework) project.
-   In the `CamnClient/ClientApp` directory, run `npm install --no-optional`
-   In the `CamnClient/ClientApp` directory, run `npm run build` to build

## Prerequisites

-   Database with schema found in [`CamnLib/DatabaseSchema.sql`](CamnLib/DatabaseSchema.sql)
-   Azure Key Vault
    *   Environment Variables Set to access your Key Vault: camnBaseUrl, camnClientID, and camnClientSecret
    *   Keys set in the Key Vault:
        -   ConnectionStrings--CamnContext
        -   ConnectionStrings--CamnContextWriter
        -   ConnectionStrings--GeodbContext
        -   ConnectionStrings--JDEContext
        -   FlowWorksApiKey

## Development

Prerequisites:

-   `node` v10+
-   `npm` 6+


