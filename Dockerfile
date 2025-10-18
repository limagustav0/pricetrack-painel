FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm install

# Copiar o resto dos arquivos
COPY . .

# Expor a porta
EXPOSE 3000

# Comando de desenvolvimento
CMD ["npm", "run", "dev"]