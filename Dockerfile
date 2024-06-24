FROM ubuntu:latest
RUN apt-get --yes update
RUN apt-get --yes install curl git
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get --yes install nodejs

#Replace with the UID of the desired user on your host
RUN useradd --system --shell "/bin/sh" --create-home --user-group --uid 1000 bitmex-scaled-orders
WORKDIR /home/bitmex-scaled-orders/
RUN git clone https://github.com/Effanuel/BitMEX-scaled-orders.git
RUN chown -R 1000:1000 /home/bitmex-scaled-orders/BitMEX-scaled-orders
WORKDIR /home/bitmex-scaled-orders/BitMEX-scaled-orders/api

#https://github.com/Effanuel/BitMEX-scaled-orders/issues/7
RUN sed -i 's/SET //g' /home/bitmex-scaled-orders/BitMEX-scaled-orders/api/package.json /home/bitmex-scaled-orders/BitMEX-scaled-orders/client/package.json

#Delete the env file so we can bind it outside the container
RUN rm -f /home/bitmex-scaled-orders/BitMEX-scaled-orders/api/.env

WORKDIR /home/bitmex-scaled-orders/BitMEX-scaled-orders/api
RUN /usr/bin/npm run init:packages
RUN /usr/bin/npm run build
RUN rm -rf /var/lib/apt/lists/*

USER bitmex-scaled-orders
EXPOSE 3001
ENTRYPOINT ["/usr/bin/npm","run","prod"]
