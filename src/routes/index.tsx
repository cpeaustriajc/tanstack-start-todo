import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import { TodoPage } from "#/features/todo/todo-page.tsx";
import { listTodos } from "#/server/todo/todo-functions.ts";

const TodoRoute = () => <TodoPage todos={useLoaderData({ from: "/" })} />;

export const Route = createFileRoute("/")({ component: TodoRoute, loader: () => listTodos() });
