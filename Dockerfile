FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ScraperAgent.csproj ./
COPY ScraperAgent.ServiceDefaults/ScraperAgent.ServiceDefaults.csproj ./ScraperAgent.ServiceDefaults/
RUN dotnet restore ScraperAgent.csproj

COPY . .
RUN dotnet publish ScraperAgent.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5100
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5100

ENTRYPOINT ["dotnet", "ScraperAgent.dll"]
