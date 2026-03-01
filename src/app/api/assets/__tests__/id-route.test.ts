import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    bankAccount: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { GET, PUT, DELETE } from "@/app/api/assets/[type]/[id]/route";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

const params = { type: "bank-accounts", id: "item1" };

describe("GET /api/assets/[type]/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new NextRequest(new URL("http://localhost/api/assets/bank-accounts/item1"));
    const res = await GET(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when item not found or not owned", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.bankAccount.findFirst as any).mockResolvedValue(null);
    const req = new NextRequest(new URL("http://localhost/api/assets/bank-accounts/item1"));
    const res = await GET(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns item when found and owned", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.bankAccount.findFirst as any).mockResolvedValue({ id: "item1", bankName: "My Bank" });
    const req = new NextRequest(new URL("http://localhost/api/assets/bank-accounts/item1"));
    const res = await GET(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bankName).toBe("My Bank");
  });
});

describe("PUT /api/assets/[type]/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when item not owned", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.bankAccount.findFirst as any).mockResolvedValue(null);
    const req = new NextRequest(new URL("http://localhost/api/assets/bank-accounts/item1"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankName: "Updated" }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(404);
  });

  it("converts empty strings to null in update", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.bankAccount.findFirst as any).mockResolvedValue({ id: "item1" });
    (prisma.bankAccount.update as any).mockResolvedValue({ id: "item1", sortCode: null });

    const req = new NextRequest(new URL("http://localhost/api/assets/bank-accounts/item1"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "should-strip",
        bankName: "Updated Bank",
        sortCode: "",
      }),
    });
    const res = await PUT(req, { params });
    expect(res.status).toBe(200);

    const updateData = (prisma.bankAccount.update as any).mock.calls[0][0].data;
    expect(updateData.id).toBeUndefined();
    expect(updateData.sortCode).toBeNull();
    expect(updateData.bankName).toBe("Updated Bank");
  });
});

describe("DELETE /api/assets/[type]/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when item not owned", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.bankAccount.findFirst as any).mockResolvedValue(null);
    const req = new NextRequest(new URL("http://localhost/api/assets/bank-accounts/item1"));
    const res = await DELETE(req, { params });
    expect(res.status).toBe(404);
  });

  it("deletes item when owned", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "user1" } });
    (prisma.bankAccount.findFirst as any).mockResolvedValue({ id: "item1" });
    (prisma.bankAccount.delete as any).mockResolvedValue({ id: "item1" });

    const req = new NextRequest(new URL("http://localhost/api/assets/bank-accounts/item1"));
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("Deleted");
    expect(prisma.bankAccount.delete).toHaveBeenCalledWith({ where: { id: "item1" } });
  });
});
