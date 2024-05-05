import path from "path"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { en } from "payload/i18n/en"
import {
  AlignFeature,
  BlockQuoteFeature,
  BlocksFeature,
  BoldFeature,
  HeadingFeature,
  IndentFeature,
  InlineCodeFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  RelationshipFeature,
  UnorderedListFeature,
  UploadFeature,
  ChecklistFeature,
  HTMLConverterFeature,
  sortFeaturesForOptimalLoading,
  loadFeatures,
  lexicalHTML,
} from "@payloadcms/richtext-lexical"
// import { slateEditor } from "@payloadcms/richtext-slate"
// import { mongooseAdapter } from "@payloadcms/db-mongodb"
import { buildConfig } from "payload/config"
import sharp from "sharp"
import { fileURLToPath } from "url"
import { seoPlugin } from "@payloadcms/plugin-seo"
import { nodemailerAdapter } from "@payloadcms/email-nodemailer"
import nodemailer from "nodemailer"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  editor: lexicalEditor({
    features({ defaultFeatures }) {
      return [
        AlignFeature(),
        BlockQuoteFeature(),
        BoldFeature(),
        HeadingFeature(),
        IndentFeature(),
        InlineCodeFeature(),
        ItalicFeature(),
        LinkFeature(),
        OrderedListFeature(),
        ParagraphFeature(),
        RelationshipFeature(),
        UnorderedListFeature(),
        UploadFeature(),
        ChecklistFeature(),
        HTMLConverterFeature(),
      ]
    },
  }),
  collections: [
    {
      slug: "users",
      auth: true,
      access: {
        delete: () => false,
        update: () => false,
      },
      fields: [],
    },
    {
      slug: "pages",
      admin: {
        useAsTitle: "title",
      },
      fields: [
        {
          name: "title",
          type: "text",
        },
        {
          name: "content",
          type: "richText",
        },
        lexicalHTML("content", { name: "contentHtml" }),
      ],
    },
    {
      slug: "media",
      upload: true,
      fields: [
        {
          name: "text",
          type: "text",
        },
      ],
    },
  ],
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URI || "",
    },
  }),
  // db: mongooseAdapter({
  //   url: process.env.MONGODB_URI || "",
  // }),

  /**
   * Payload can now accept specific translations from 'payload/i18n/en'
   * This is completely optional and will default to English if not provided
   */
  i18n: {
    supportedLanguages: { en },
  },

  admin: {
    autoLogin:
      process.env.environment === "production"
        ? {
            email: "dev@payloadcms.com",
            password: "test",
            prefillOnly: true,
          }
        : false,
  },
  async onInit(payload) {
    const existingUsers = await payload.find({
      collection: "users",
      limit: 1,
    })

    if (existingUsers.docs.length === 0) {
      await payload.create({
        collection: "users",
        data: {
          email: "dev@payloadcms.com",
          password: "test",
        },
      })
    }
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.

  // This is temporary - we may make an adapter pattern
  // for this before reaching 3.0 stable
  sharp,
  plugins: [
    seoPlugin({
      tabbedUI: true,
      collections: ["pages"],
      uploadsCollection: "media",

      generateTitle(props) {
        return `lingo+ | ${props.title} | blog`
      },
    }),
  ],
  email: nodemailerAdapter({
    defaultFromAddress: "info@lmail.lingo-plus.ir",
    defaultFromName: "lingo+",
    // Any Nodemailer transport
    transport: await nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }),
  }),
})
