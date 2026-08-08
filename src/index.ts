import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Test Calculator & Time",
		version: "1.0.0",
	});

	async init() {
		// Addition
		this.server.tool(
			"add",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a + b) }],
			})
		);

		// Subtraction
		this.server.tool(
			"subtract",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a - b) }],
			})
		);

		// Multiplication
		this.server.tool(
			"multiply",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a * b) }],
			})
		);

		// Division (with a guard against dividing by zero)
		this.server.tool(
			"divide",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => {
				if (b === 0) {
					return {
						content: [{ type: "text", text: "Error: cannot divide by zero" }],
						isError: true,
					};
				}
				return { content: [{ type: "text", text: String(a / b) }] };
			}
		);

		// Current time (UTC, ISO format)
		this.server.tool(
			"get_current_time",
			{},
			async () => ({
				content: [{ type: "text", text: new Date().toISOString() }],
			})
		);

		// Current time in a specific timezone, e.g. "Europe/London"
		this.server.tool(
			"get_current_time_in_timezone",
			{ timezone: z.string().describe('IANA timezone name, e.g. "Europe/London", "America/New_York"') },
			async ({ timezone }) => {
				try {
					const formatted = new Date().toLocaleString("en-GB", {
						timeZone: timezone,
						dateStyle: "full",
						timeStyle: "long",
					});
					return { content: [{ type: "text", text: formatted }] };
				} catch {
					return {
						content: [{ type: "text", text: `Error: unrecognized timezone "${timezone}"` }],
						isError: true,
					};
				}
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
