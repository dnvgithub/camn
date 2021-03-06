USE [CAMN]
GO
/****** Object:  Table [dbo].[BASEMAP] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BASEMAP](
	[URL] [nvarchar](200) NOT NULL,
	[OPACITY] [float] NOT NULL,
	[NAME] [nvarchar](100) NOT NULL,
	[THUMBNAIL] [nvarchar](200) NOT NULL,
	[SELECTED] [bit] NOT NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DEFAULT_MAPVIEW] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DEFAULT_MAPVIEW](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[USER_NAME] [nvarchar](50) NOT NULL,
	[APPLICATION] [nvarchar](50) NOT NULL,
	[TIMESTAMP] [datetime] NOT NULL,
	[MAPVIEWID] [int] NOT NULL,
 CONSTRAINT [PK_DEFAULT_MAPVIEW_USER_NAME_APPLICATION] PRIMARY KEY CLUSTERED 
(
	[USER_NAME] ASC,
	[APPLICATION] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FLOWWORKS_SITE] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FLOWWORKS_SITE](
	[STATION_ID] [int] NOT NULL,
	[STATION_NAME] [nvarchar](100) NULL,
	[FW_SITE_ID] [int] NOT NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LAYER] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LAYER](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[NAME] [nvarchar](200) NOT NULL,
	[TYPE] [tinyint] NOT NULL,
	[MIN_ZOOM] [int] NOT NULL,
 CONSTRAINT [PK_LAYER] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LAYER_FEATURE] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LAYER_FEATURE](
	[LAYER_ID] [int] NOT NULL,
	[URL] [nvarchar](200) NOT NULL,
	[OPACITY] [float] NOT NULL,
	[PROPERTYLABEL] [nvarchar](200) NULL,
	[LAYER_VERSION_ID] [int] NULL,
	[TYPE] [nvarchar](20) NULL,
	[ALLOW_INSPECTIONS] [bit] NOT NULL,
	[WRITE_URL] [nvarchar](200) NULL,
	[CAN_FILTER] [bit] NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LAYER_FEATURE_VERSION] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LAYER_FEATURE_VERSION](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[LAYER_FEATURE_DOMAIN] [nvarchar](200) NULL,
	[TIMESTAMP] [datetime] NOT NULL,
	[PROXY_DOMAIN] [nvarchar](200) NULL,
	[VERSION] [nvarchar](50) NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MAPVIEW] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MAPVIEW](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[USER_NAME] [nvarchar](50) NULL,
	[BOOKMARK_NAME] [nvarchar](50) NULL,
	[APPLICATION] [nvarchar](50) NULL,
	[DATA] [nvarchar](max) NULL,
	[TIMESTAMP] [datetime] NULL,
	[SHAREID] [char](36) NULL,
 CONSTRAINT [PK_MAPVIEW_ID] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[USERACTION] ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[USERACTION](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[USER_NAME] [nvarchar](50) NULL,
	[APPLICATION] [nvarchar](50) NULL,
	[ACTION] [nvarchar](50) NULL,
	[DETAILS] [nvarchar](max) NULL,
	[TIMESTAMP] [datetime] NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[LAYER_FEATURE] ADD  CONSTRAINT [DF_LAYER_FEATURE_LAYER_ID]  DEFAULT ((0)) FOR [LAYER_ID]
GO
ALTER TABLE [dbo].[DEFAULT_MAPVIEW]  WITH CHECK ADD  CONSTRAINT [FK_MAPVIEWID_MAPVIEW_ID] FOREIGN KEY([MAPVIEWID])
REFERENCES [dbo].[MAPVIEW] ([ID])
GO
ALTER TABLE [dbo].[DEFAULT_MAPVIEW] CHECK CONSTRAINT [FK_MAPVIEWID_MAPVIEW_ID]
GO
ALTER TABLE [dbo].[LAYER_FEATURE]  WITH CHECK ADD  CONSTRAINT [FK_LayerFeature_Layer] FOREIGN KEY([LAYER_ID])
REFERENCES [dbo].[LAYER] ([ID])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[LAYER_FEATURE] CHECK CONSTRAINT [FK_LayerFeature_Layer]
GO
