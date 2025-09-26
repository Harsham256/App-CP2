using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TitleVerification.Api.Data;
using TitleVerification.Api.Helpers;

var builder = WebApplication.CreateBuilder(args);

// CORS policy name
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// Register DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// Bind JwtSettings and register for DI
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings")
);
builder.Services.AddSingleton(sp =>
    builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()
);

// Controllers and Services
builder.Services.AddControllers();
builder.Services.AddScoped<TitleVerification.Api.Services.IDocumentService, TitleVerification.Api.Services.DocumentService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// JWT Authentication
var jwtConfig = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtConfig.Issuer,
            ValidAudience = jwtConfig.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtConfig.Secret)
            )
        };
    });

builder.Services.AddAuthorization();

// Swagger services (should be before builder.Build())
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Middleware order
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseCors(MyAllowSpecificOrigins);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();