using Microsoft.EntityFrameworkCore;
using ScraperAgent.Data.Entities;

namespace ScraperAgent.Data;

public class ScraperAgentDbContext : DbContext
{
    public ScraperAgentDbContext(DbContextOptions<ScraperAgentDbContext> options)
        : base(options)
    {
    }

    public DbSet<ExpertEntity> Experts => Set<ExpertEntity>();
    public DbSet<EmailRecipientEntity> EmailRecipients => Set<EmailRecipientEntity>();
    public DbSet<AIModelEntity> AIModels => Set<AIModelEntity>();
    public DbSet<ReportEntity> Reports => Set<ReportEntity>();
    public DbSet<ScheduleEntity> Schedules => Set<ScheduleEntity>();
    public DbSet<SubscriberEntity> Subscribers => Set<SubscriberEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ExpertEntity>(entity =>
        {
            entity.ToTable("experts");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Handle)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.DisplayName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Category)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Domain)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Weight)
                .HasDefaultValue(5);

            entity.Property(e => e.Bias)
                .HasMaxLength(200)
                .HasDefaultValue("");

            entity.HasIndex(e => new { e.Handle, e.Domain })
                .IsUnique();
        });

        modelBuilder.Entity<EmailRecipientEntity>(entity =>
        {
            entity.ToTable("email_recipients");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(320);

            entity.Property(e => e.Domain)
                .IsRequired()
                .HasMaxLength(50);

            entity.HasIndex(e => new { e.Email, e.Domain })
                .IsUnique();
        });

        modelBuilder.Entity<AIModelEntity>(entity =>
        {
            entity.ToTable("ai_models");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Provider)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Endpoint)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.ApiKey)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.DeploymentName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.Domain)
                .IsRequired()
                .HasMaxLength(50);

            entity.HasIndex(e => new { e.Name, e.Domain })
                .IsUnique();
        });

        modelBuilder.Entity<ReportEntity>(entity =>
        {
            entity.ToTable("reports");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasMaxLength(50);

            entity.Property(e => e.Domain)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.OverallSentiment)
                .HasMaxLength(50);

            entity.Property(e => e.ReportJson)
                .HasColumnType("jsonb");

            entity.HasIndex(e => e.GeneratedAt);
            entity.HasIndex(e => e.Domain);
        });

        modelBuilder.Entity<SubscriberEntity>(entity =>
        {
            entity.ToTable("subscribers");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(320);

            entity.Property(e => e.DomainPreference)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.ManagementToken)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Name)
                .HasMaxLength(200);

            entity.Property(e => e.MollieCustomerId)
                .HasMaxLength(100);

            entity.Property(e => e.MollieSubscriptionId)
                .HasMaxLength(100);

            entity.Property(e => e.MollieMandateId)
                .HasMaxLength(100);

            entity.Property(e => e.MollieFirstPaymentId)
                .HasMaxLength(100);

            entity.Property(e => e.EmailVerificationToken)
                .HasMaxLength(100);

            entity.Property(e => e.ConsentIpAddress)
                .HasMaxLength(45);

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.ManagementToken).IsUnique();
            entity.HasIndex(e => e.MollieCustomerId);
            entity.HasIndex(e => new { e.Status, e.DomainPreference });
        });

        modelBuilder.Entity<ScheduleEntity>(entity =>
        {
            entity.ToTable("schedules");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(e => e.CronExpression)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Domain)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Timezone)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.LastRunJobId)
                .HasMaxLength(50);

            entity.Property(e => e.LastRunStatus)
                .HasMaxLength(50);

            entity.HasIndex(e => e.NextRunAt);
        });
    }
}
