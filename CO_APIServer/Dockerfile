
# build container ontop of the latest node Docker image 
FROM node

MAINTAINER Anders_Granvald

# set workdir to /app
WORKDIR /app

# copy node dependencies to working directory in container
COPY package.json /app

RUN npm install

# copy all files in the current dir to the /app dir
COPY . /app

CMD ls /app

# run the server
CMD node server.js

# expose port 3000 on the outside of the container
EXPOSE 3000
