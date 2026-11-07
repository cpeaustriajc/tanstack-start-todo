import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

import stylesheet from "#/styles.css?url";

const RootDocument = () => (
  <html lang="en">
    <head>
      <HeadContent />
    </head>
    <body>
      <Outlet />
      <Scripts />
    </body>
  </html>
);

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: "stylesheet", href: stylesheet }],
    meta: [
      { charSet: "utf8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Todos" },
    ],
  }),
  component: RootDocument,
});
