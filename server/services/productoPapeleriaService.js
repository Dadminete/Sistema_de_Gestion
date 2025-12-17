const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllProductosPapeleria = async () => {
    return prisma.productoPapeleria.findMany({ include: { categoria: true } });
};

const getProductoPapeleriaById = async (id) => {
    return prisma.productoPapeleria.findUnique({ 
        where: { id: parseInt(id) },
        include: { categoria: true }
    });
};

const createProductoPapeleria = async (data) => {
    try {
        // Validate required fields
        if (!data.codigo || !data.codigo.trim()) {
            throw new Error('El código del producto es requerido.');
        }

        if (!data.nombre || !data.nombre.trim()) {
            throw new Error('El nombre del producto es requerido.');
        }

        if (!data.categoriaId || data.categoriaId === 0) {
            throw new Error('Debe seleccionar una categoría.');
        }

        // Check if categoria exists
        const categoriaExists = await prisma.categoriaPapeleria.findUnique({
            where: { id: BigInt(data.categoriaId) }
        });

        if (!categoriaExists) {
            throw new Error(`La categoría con ID ${data.categoriaId} no existe.`);
        }

        // Check for duplicate codigo
        const existingProducto = await prisma.productoPapeleria.findFirst({
            where: {
                codigo: data.codigo.trim()
            }
        });

        if (existingProducto) {
            throw new Error(`Ya existe un producto con el código "${data.codigo}". Por favor, use un código diferente.`);
        }

        // Handle codigoBarras - set to null if empty
        let codigoBarrasValue = null;
        if (data.codigoBarras && data.codigoBarras.trim()) {
            codigoBarrasValue = data.codigoBarras.trim();
        }

        // Prepare data for creation
        const processedData = {
            codigo: data.codigo.trim(),
            nombre: data.nombre.trim(),
            descripcion: data.descripcion ? data.descripcion.trim() : null,
            categoriaId: BigInt(data.categoriaId),
            marca: data.marca ? data.marca.trim() : null,
            modelo: data.modelo ? data.modelo.trim() : null,
            unidadMedida: data.unidadMedida || 'unidad',
            precioCompra: parseFloat(data.precioCompra) || 0,
            precioVenta: parseFloat(data.precioVenta) || 0,
            margenGanancia: parseFloat(data.margenGanancia) || 0,
            stockMinimo: parseInt(data.stockMinimo) || 0,
            stockActual: parseInt(data.stockActual) || 0,
            ubicacion: data.ubicacion ? data.ubicacion.trim() : null,
            codigoBarras: codigoBarrasValue,
            imagen: data.imagen ? data.imagen.trim() : null,
            activo: data.activo !== undefined ? data.activo : true,
            proveedorId: data.proveedorId || null,
        };

        console.log('Creating product with data:', processedData);

        const newProduct = await prisma.productoPapeleria.create({ data: processedData });

        console.log('Product created successfully:', newProduct.id);

        return newProduct;
    } catch (error) {
        console.error('Error in createProductoPapeleria:', error);
        throw error;
    }
};

const updateProductoPapeleria = async (id, data) => {
    try {
        console.log('Updating product with data:', data);

        // Separate categoriaId from other data if present
        const { categoriaId, ...updateData } = data;

        // If categoriaId is provided, validate it exists
        if (categoriaId !== undefined) {
            if (categoriaId && categoriaId !== 0) {
                const categoriaExists = await prisma.categoriaPapeleria.findUnique({
                    where: { id: BigInt(categoriaId) }
                });

                if (!categoriaExists) {
                    throw new Error(`La categoría con ID ${categoriaId} no existe.`);
                }

                updateData.categoriaId = BigInt(categoriaId);
            }
        }

        // Check for duplicate codigo if codigo is being updated
        if (updateData.codigo !== undefined) {
            const trimmedCodigo = updateData.codigo.trim();

            // Check if another product already has this codigo
            const existingProducto = await prisma.productoPapeleria.findFirst({
                where: {
                    codigo: trimmedCodigo,
                    id: { not: parseInt(id) } // Exclude current product
                }
            });

            if (existingProducto) {
                throw new Error(`Ya existe otro producto con el código "${trimmedCodigo}". Por favor, use un código diferente.`);
            }

            updateData.codigo = trimmedCodigo;
        }

        // Check for duplicate codigoBarras if codigoBarras is being updated
        if (updateData.codigoBarras !== undefined && updateData.codigoBarras !== '') {
            const trimmedCodigoBarras = updateData.codigoBarras.trim();

            // Check if another product already has this codigoBarras
            const existingProducto = await prisma.productoPapeleria.findFirst({
                where: {
                    codigoBarras: trimmedCodigoBarras,
                    id: { not: parseInt(id) } // Exclude current product
                }
            });

            if (existingProducto) {
                throw new Error(`Ya existe otro producto con el código de barras "${trimmedCodigoBarras}". Por favor, use un código de barras diferente.`);
            }

            updateData.codigoBarras = trimmedCodigoBarras;
        }

        // If codigoBarras is empty string, set to null
        if (updateData.codigoBarras === '') {
            updateData.codigoBarras = null;
        }

        // Ensure proper data types for other fields
        if (updateData.precioCompra !== undefined) {
            updateData.precioCompra = parseFloat(updateData.precioCompra) || 0;
        }
        if (updateData.precioVenta !== undefined) {
            updateData.precioVenta = parseFloat(updateData.precioVenta) || 0;
        }
        if (updateData.margenGanancia !== undefined) {
            updateData.margenGanancia = parseFloat(updateData.margenGanancia) || 0;
        }
        if (updateData.stockMinimo !== undefined) {
            updateData.stockMinimo = parseInt(updateData.stockMinimo) || 0;
        }
        if (updateData.stockActual !== undefined) {
            updateData.stockActual = parseInt(updateData.stockActual) || 0;
        }

        // Trim string fields
        if (updateData.nombre) updateData.nombre = updateData.nombre.trim();
        if (updateData.descripcion) updateData.descripcion = updateData.descripcion.trim();
        if (updateData.marca) updateData.marca = updateData.marca.trim();
        if (updateData.modelo) updateData.modelo = updateData.modelo.trim();
        if (updateData.ubicacion) updateData.ubicacion = updateData.ubicacion.trim();
        if (updateData.codigoBarras) updateData.codigoBarras = updateData.codigoBarras.trim();
        if (updateData.imagen) updateData.imagen = updateData.imagen.trim();

        console.log('Processed update data:', updateData);

        const updatedProduct = await prisma.productoPapeleria.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: { categoria: true }
        });

        console.log('Product updated successfully:', updatedProduct.id);
        return updatedProduct;
    } catch (error) {
        console.error('Error in updateProductoPapeleria:', error);
        throw error;
    }
};

const deleteProductoPapeleria = async (id) => {
    return prisma.productoPapeleria.delete({ where: { id: parseInt(id) } });
};

module.exports = {
    getAllProductosPapeleria,
    getProductoPapeleriaById,
    createProductoPapeleria,
    updateProductoPapeleria,
    deleteProductoPapeleria,
};
