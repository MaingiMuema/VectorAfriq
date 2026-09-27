import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface CompanyData {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  socialMedia: string | null;
  userId: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID first
    const [user] = await query<{ id: string }>(
      "SELECT id FROM user WHERE email = ?",
      [session.user.email]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get company data
    const [company] = await query<CompanyData>(
      `SELECT * FROM company WHERE userId = ?`,
      [user.id]
    );

    // If no company exists, return empty data with default values
    if (!company) {
      return NextResponse.json({
        id: "",
        name: "",
        logo: "/images/placeholder.png",
        description: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        socialMedia: {},
        userId: user.id,
      });
    }

    // Parse social media JSON
    const formattedCompany = {
      ...company,
      socialMedia: company.socialMedia ? JSON.parse(company.socialMedia) : {},
    };

    return NextResponse.json(formattedCompany);
  } catch (error) {
    console.error("[COMPANY_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch company information" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const [user] = await query<{ id: string }>(
      "SELECT id FROM user WHERE email = ?",
      [session.user.email]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has a company
    const [existingCompany] = await query<CompanyData>(
      "SELECT id FROM company WHERE userId = ?",
      [user.id]
    );

    if (existingCompany) {
      return NextResponse.json(
        { error: "Company already exists for this user" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const {
      name,
      logo,
      description,
      email,
      phone,
      website,
      address,
      socialMedia,
    } = data;

    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Generate company ID
    const companyId = `cm${Date.now().toString(36)}${Math.random()
      .toString(36)
      .substr(2, 5)}`;

    // Create company record
    const insertQuery = `
      INSERT INTO company (
        id, name, logo, description, email, phone, website, address, socialMedia, userId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    await query(insertQuery, [
      companyId,
      name,
      logo || null,
      description || null,
      email || null,
      phone || null,
      website || null,
      address || null,
      socialMedia ? JSON.stringify(socialMedia) : null,
      user.id,
    ]);

    // Fetch created company
    const [createdCompany] = await query<CompanyData>(
      "SELECT * FROM company WHERE id = ?",
      [companyId]
    );

    const formattedCompany = {
      ...createdCompany,
      socialMedia: createdCompany.socialMedia
        ? JSON.parse(createdCompany.socialMedia)
        : {},
    };

    return NextResponse.json({
      success: true,
      company: formattedCompany,
    });
  } catch (error) {
    console.error("[COMPANY_POST]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create company",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const [user] = await query<{ id: string }>(
      "SELECT id FROM user WHERE email = ?",
      [session.user.email]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = await request.json();
    const {
      name,
      logo,
      description,
      email,
      phone,
      website,
      address,
      socialMedia,
    } = data;

    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Get existing company
    const [company] = await query<CompanyData>(
      "SELECT id FROM company WHERE userId = ?",
      [user.id]
    );

    let companyId;

    if (company) {
      // Update existing company
      const updateQuery = `
        UPDATE company 
        SET 
          name = ?,
          logo = ?,
          description = ?,
          email = ?,
          phone = ?,
          website = ?,
          address = ?,
          socialMedia = ?,
          updatedAt = CURRENT_TIMESTAMP
        WHERE userId = ?
      `;

      await query(updateQuery, [
        name,
        logo || null,
        description || null,
        email || null,
        phone || null,
        website || null,
        address || null,
        socialMedia ? JSON.stringify(socialMedia) : null,
        user.id,
      ]);

      companyId = company.id;
    } else {
      // Create new company
      companyId = `cm${Date.now().toString(36)}${Math.random()
        .toString(36)
        .substr(2, 5)}`;

      const insertQuery = `
        INSERT INTO company (
          id, name, logo, description, email, phone, website, address, socialMedia, userId, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      await query(insertQuery, [
        companyId,
        name,
        logo || null,
        description || null,
        email || null,
        phone || null,
        website || null,
        address || null,
        socialMedia ? JSON.stringify(socialMedia) : null,
        user.id,
      ]);
    }

    // Fetch updated company
    const [updatedCompany] = await query<CompanyData>(
      "SELECT * FROM company WHERE id = ?",
      [companyId]
    );

    const formattedCompany = {
      ...updatedCompany,
      socialMedia: updatedCompany.socialMedia
        ? JSON.parse(updatedCompany.socialMedia)
        : {},
    };

    return NextResponse.json({
      success: true,
      company: formattedCompany,
    });
  } catch (error) {
    console.error("[COMPANY_PATCH]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update company",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
