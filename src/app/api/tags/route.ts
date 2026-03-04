import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Массив твоих конкретных цветов
const COLORS = [
  '#F7ADC499',
  '#48C88499',
  '#AB48BF99',
  '#FE4D3D66',
  '#44962766',
  '#41A5F399'
];

// Получить все теги
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(tags, { status: 200 });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении тегов' },
      { status: 500 }
    );
  }
}

// Создать новый тег
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Название тега обязательно' },
        { status: 400 }
      );
    }

    // Выбираем случайный цвет из твоего списка
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color: randomColor,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    // Проверяем на уникальность имени
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Тег с таким названием уже существует' },
        { status: 400 }
      );
    }
    
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании тега' },
      { status: 500 }
    );
  }
}

// Обновить тег
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tag_id, name, color } = body;

    if (!tag_id) {
      return NextResponse.json(
        { error: 'Не указан ID тега' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name && typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }
    if (color && typeof color === 'string') {
      // Проверяем, что цвет из разрешенного списка (опционально)
      if (!COLORS.includes(color)) {
        return NextResponse.json(
          { error: 'Недопустимый цвет' },
          { status: 400 }
        );
      }
      updateData.color = color;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Нет данных для обновления' },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.update({
      where: { tag_id: Number(tag_id) },
      data: updateData,
    });

    return NextResponse.json(tag, { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Тег с таким названием уже существует' },
        { status: 400 }
      );
    }
    
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении тега' },
      { status: 500 }
    );
  }
}

// Удалить тег
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('id');

    if (!tagId) {
      return NextResponse.json(
        { error: 'Не указан ID тега' },
        { status: 400 }
      );
    }

    await prisma.tag.delete({
      where: { tag_id: Number(tagId) },
    });

    return NextResponse.json(
      { success: true, message: 'Тег успешно удален' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении тега' },
      { status: 500 }
    );
  }
}