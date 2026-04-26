"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Calendar, MessageSquare, ShieldCheck, Zap, Layers,
  Github, Twitter, Mail,
  Eye
} from "lucide-react";
import Image from "next/image";
import styles from "./LandingPage.module.css";
import { AuthWindow } from "@/components/shared/auth-window/auth-window";
import { ImageModal } from "@/components/ui/image-modal/Image-modal";

// Данные для секций
const features = [
  {
    title: "Полный контроль над созданием контента",
    description: "Отслеживайте каждый этап создания контента. Наша система статусов позволяет видеть, где работа встала, а где идет с опережением графика.",
    image: "/images/dashboard.png",
  },
  {
    title: "Интерактивный календарь",
    description: "Планируйте публикации во все соцсети в едином визуальном пространстве. Отслеживайте и изменяйте содержание контента. Управляйте проектами, публикациями и задачами в одном пространстве.",
    image: "/images/calendar.png",
  },
  {
    title: "Легкое взаимодействие",
    description: "Получайте правки прямо в интерфейсе и отмечайте их выполнение. Прикрепляйте файлы и ставьте задачи прямо в контексте проекта.",
    image: "/images/comments.png",
  },
  {
    title: "Весь контент в одном элементе",
    description: "Отслеживайте весь контент в одном элементе. Не нужно открывать отдельные окна для каждого поста.",
    image: "/images/post-modal.png",
  }
];

// Конфигурация анимаций
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 }
  }
};

const hoverEffect = {
  scale: 1.02,
  y: -8,
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25
  }
};

const imageHover = {
  scale: 1.03,
  y: -5,
  transition: {
    type: "spring" as const,
    stiffness: 300,
    damping: 25
  }
};

const featureAnimation = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 50,
      damping: 20,
      duration: 0.8
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string, alt: string } | null>(null);

  const handleAuthSuccess = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className={styles.mainWrapper}>
      <div className={styles.heroGlow} />

      {/* Навигация */}
      <header className={styles.navbar}>
        <div className={styles.logo}>T4SKS<span>.</span></div>
        <nav className={styles.navLinks}>
          <a href="#functions" className={styles.navLink}>Функции</a>
          <a href="#workflow" className={styles.navLink}>Процесс</a>
          <a href="#features" className={styles.navLink}>Сводка</a>
          <a href="#footer" className={styles.navLink}>FAQ</a>
        </nav>
        <button onClick={() => setIsAuthOpen(true)} className={styles.btnSecondary}>Войти</button>
      </header>

      {/* Hero секция */}
      <motion.section
        className={styles.heroSection}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className={styles.badge}>
          <Zap size={14} /> <span>Ускорьте продакшн в 2 раза</span>
        </motion.div>

        <motion.h1 variants={itemVariants} className={styles.title}>
          Управляйте задачами <br />
          <span className={styles.gradientText}>создавайте контент</span>
        </motion.h1>

        <motion.p variants={itemVariants} className={styles.description}>
          Cистема управления проектами, созданная специально для креативных команд.
          От идеи поста до финальной публикации — всё в одном интерфейсе.
        </motion.p>

        {/* Галерея скриншотов проекта */}
        <section id="functions">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={styles.featureBlock}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={featureAnimation}
            >
              {/* Контент с текстом */}
              <div className={styles.featureTextContent}>
                <h2 className={styles.featureTitle}>
                  {index === 0 && <span className={styles.gradientText}>01. </span>}
                  {index === 1 && <span className={styles.gradientText}>02. </span>}
                  {index === 2 && <span className={styles.gradientText}>03. </span>}
                  {index === 3 && <span className={styles.gradientText}>04. </span>}
                  {feature.title}
                </h2>
                <p className={styles.featureDescription}>
                  {feature.description}
                </p>
                <div>
                  <button className={styles.btnSecondary}>Узнать больше</button>
                </div>
              </div>

              {/* Контент с картинкой */}
              <motion.div
                className={styles.featureImageWrapper}
                whileHover={imageHover}
                onClick={() => setSelectedImage({ src: feature.image, alt: feature.title })}
              >
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className={styles.projectImage}
                />
              </motion.div>
            </motion.div>
          ))}
        </section>

      </motion.section>

      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageSrc={selectedImage?.src || ""}
        imageAlt={selectedImage?.alt || ""}
      />

      {/* Bento Grid Features */}
      <section id="features" className={styles.bentoGrid}>
        <motion.div
          className={`${styles.bentoItem} ${styles.large}`}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          whileHover={hoverEffect}
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className={styles.iconWrapper}><Users size={120} /></div>
          <h3 className={styles.bentoTitle}>Ролевая модель</h3>
          <p className={styles.bentoText}>
            Уникальные интерфейсы для дизайнеров, фотографов и SMM-менеджеров.
            Каждый видит только то, что важно для выполнения его части задачи.
          </p>
        </motion.div>

        <motion.div
          className={`${styles.bentoItem} ${styles.tall}`}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          whileHover={hoverEffect}
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className={styles.iconWrapper}><MessageSquare size={80} /></div>
          <h3 className={styles.bentoTitle}>Контекстные правки</h3>
          <p className={styles.bentoText}>Забудьте о правках в Telegram, отслеживайте их прямо в карточке поста.</p>
        </motion.div>

        <motion.div
          className={`${styles.bentoItem} ${styles.tall}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={hoverEffect}
          viewport={{ once: true, amount: 0.10 }}
        >
          <div className={styles.iconWrapper}><Calendar size={100} /></div>
          <h3 className={styles.bentoTitle}>Календарь публикаций</h3>
          <p className={styles.bentoText}>
            Визуальный план-сетка для всех ваших площадок: Telegram, VK и других.
            Контролируйте дедлайны одним взглядом.
          </p>
        </motion.div>

        <motion.div
          className={styles.bentoItem}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          whileHover={hoverEffect}
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className={styles.iconWrapper}><ShieldCheck size={80} /></div>
          <h3 className={styles.bentoTitle}>Безопасность</h3>
          <p className={styles.bentoText}>Ваши данные защищены и хранятся на надежных серверах с ежедневным бэкапом.</p>
        </motion.div>

        {/* <motion.div
          className={styles.bentoItem}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          whileHover={hoverEffect}
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className={styles.iconWrapper}><Layers size={80} /></div>
          <h3 className={styles.bentoTitle}>Версионность</h3>
          <p className={styles.bentoText}>Храните все итерации дизайна и текстов в одном месте без риска потери.</p>
        </motion.div> */}

        <motion.div
          className={`${styles.bentoItem} ${styles.large}`}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          whileHover={hoverEffect}
          viewport={{ once: true, amount: 0.15 }}
        >
          <div className={styles.iconWrapper}><Eye size={120} /></div>
          <h3 className={styles.bentoTitle}>Наглядная организация</h3>
          <p className={styles.bentoText}>
            Простая постановка задач с жесткими дедлайнами и отслеживанием статусов
            на каждом этапе производства.
          </p>
        </motion.div>
      </section>

      {/* Футер */}
      <footer id="footer" className={styles.footer}>
        <div className={styles.footerContainer}>
          {/* Бренд и описание */}
          <div className={styles.footerBrand}>
            <div className={styles.logo}>T4SKS<span>.</span></div>
            <p>
              Профессиональная среда для управления креативным производством.
              Делаем командную работу прозрачной.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialIcon}><Twitter size={20} /></a>
              <a href="#" className={styles.socialIcon}><Github size={20} /></a>
              <a href="#" className={styles.socialIcon}><Mail size={20} /></a>
            </div>
          </div>

          {/* Колонки ссылок */}
          <div className={styles.footerColumn}>
            <h4>Продукт</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#functions" className={styles.footerLink}>Возможности</a></li>
              <li><a href="#features" className={styles.footerLink}>Преимущества</a></li>
              <li><a href="#" className={styles.footerLink}>Статистика</a></li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4>Компания</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#" className={styles.footerLink}>О нас</a></li>
              <li><a href="#" className={styles.footerLink}>Блог</a></li>
              <li><a href="#" className={styles.footerLink}>Карьера</a></li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h4>Поддержка</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#" className={styles.footerLink}>Документация</a></li>
              <li><a href="#" className={styles.footerLink}>Помощь</a></li>
              <li><a href="#" className={styles.footerLink}>Статус</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} T4SKS. Все права защищены.</p>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <a href="#" className={styles.footerLink}>Privacy Policy</a>
            <a href="#" className={styles.footerLink}>Terms of Service</a>
          </div>
        </div>
      </footer>

      {isAuthOpen && (
        <AuthWindow
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}