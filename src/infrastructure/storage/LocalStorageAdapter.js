const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const StorageAdapter = require('./StorageAdapter');
const pipeline = promisify(stream.pipeline);

class LocalStorageAdapter extends StorageAdapter {
    constructor(basePath) {
        super();
        this.basePath = basePath;
        // Asegurar que exista la carpeta base
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }

    _resolvePath(relativePath) {
        return path.join(this.basePath, relativePath);
    }

    async save(relativePath, content) {
        const fullPath = this._resolvePath(relativePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
            await fs.promises.mkdir(dir, { recursive: true });
        }

        if (content instanceof stream.Readable) {
            const writeStream = fs.createWriteStream(fullPath);
            await pipeline(content, writeStream);
        } else {
            await fs.promises.writeFile(fullPath, content);
        }

        const stats = await fs.promises.stat(fullPath);
        return {
            storageType: 'LOCAL',
            basePath: this.basePath,
            relativePath: relativePath,
            fullPath: fullPath,
            size: stats.size
        };
    }

    async getStream(relativePath) {
        const fullPath = this._resolvePath(relativePath);
        if (!fs.existsSync(fullPath)) {
            throw new Error(`File not found: ${fullPath}`);
        }
        return fs.createReadStream(fullPath);
    }

    async delete(relativePath) {
        const fullPath = this._resolvePath(relativePath);
        if (fs.existsSync(fullPath)) {
            await fs.promises.unlink(fullPath);
        }
    }

    async exists(relativePath) {
        const fullPath = this._resolvePath(relativePath);
        try {
            await fs.promises.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    async move(sourceInAdapter, targetInAdapter) {
        // En local, move es rename
        const sourcePath = this._resolvePath(sourceInAdapter);
        const targetPath = this._resolvePath(targetInAdapter);
        const targetDir = path.dirname(targetPath);

        if (!fs.existsSync(targetDir)) {
            await fs.promises.mkdir(targetDir, { recursive: true });
        }

        await fs.promises.rename(sourcePath, targetPath);

        return {
            basePath: this.basePath,
            relativePath: targetInAdapter,
            fullPath: targetPath
        };
    }
}

module.exports = LocalStorageAdapter;
